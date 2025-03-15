package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"
)

type Score struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Score   int     `json:"score"`
	Time    float64 `json:"time"` // Active play time in seconds; UI displays mm:ss.
	Map     string  `json:"map"`
	Outcome string  `json:"outcome"`
}

var runID = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func validate(score Score) error {
	if !runID.MatchString(score.ID) {
		return errors.New("id must be a lowercase UUID")
	}
	if !utf8.ValidString(score.Name) || utf8.RuneCountInString(score.Name) < 1 || utf8.RuneCountInString(score.Name) > 24 {
		return errors.New("name must contain 1–24 characters")
	}
	for _, char := range score.Name {
		if unicode.IsControl(char) || unicode.Is(unicode.Cf, char) {
			return errors.New("name must not contain control characters")
		}
	}
	if score.Score < 0 || score.Score > 180 || score.Score%10 != 0 {
		return errors.New("score must be a multiple of 10 between 0 and 180")
	}
	if math.IsNaN(score.Time) || math.IsInf(score.Time, 0) || score.Time < 0 || score.Time > 45 {
		return errors.New("time must be between 0 and 45 seconds")
	}
	if score.Map != "frontier" && score.Map != "relay" && score.Map != "outpost" {
		return errors.New("unknown map")
	}
	if score.Outcome != "victory" && score.Outcome != "defeat" {
		return errors.New("outcome must be victory or defeat")
	}
	if score.Outcome == "victory" && score.Score != 180 {
		return errors.New("a victory must score 180 points")
	}
	return nil
}

type Store struct {
	mu     sync.Mutex
	path   string
	scores []Score
}

// Stable sorting preserves submission order for equal scores.
func sortScores(scores []Score) {
	sort.SliceStable(scores, func(i, j int) bool { return scores[i].Score > scores[j].Score })
}

func openStore(path string) (*Store, error) {
	store := &Store{path: path, scores: []Score{}}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return store, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(data, &store.scores); err != nil {
		return nil, fmt.Errorf("invalid score file: %w", err)
	}
	seen := make(map[string]bool)
	for _, score := range store.scores {
		if err := validate(score); err != nil {
			return nil, fmt.Errorf("invalid stored score: %w", err)
		}
		if strings.TrimSpace(score.Name) == "" || seen[score.ID] {
			return nil, errors.New("score file contains an empty name or duplicate id")
		}
		seen[score.ID] = true
	}
	if store.scores == nil {
		store.scores = []Score{}
	}
	sortScores(store.scores)
	return store, nil
}

// Commit to disk before exposing a new result. Temp file and rename avoid partial
// JSON writes; the mutex serializes concurrent POST requests within this process.
func (store *Store) persist(scores []Score) error {
	if err := os.MkdirAll(filepath.Dir(store.path), 0755); err != nil {
		return err
	}
	file, err := os.CreateTemp(filepath.Dir(store.path), ".scores-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())
	err = json.NewEncoder(file).Encode(scores)
	if err == nil {
		err = file.Sync()
	}
	closeErr := file.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	return os.Rename(file.Name(), store.path)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("response write failed: %v", err)
	}
}

func apiError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func (store *Store) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, POST")
		apiError(w, http.StatusMethodNotAllowed, "use GET or POST")
		return
	}
	if r.Method == http.MethodGet {
		store.mu.Lock()
		scores := append([]Score{}, store.scores...)
		store.mu.Unlock()
		writeJSON(w, http.StatusOK, map[string]any{"scores": scores})
		return
	}
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/json" {
		apiError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input struct {
		ID      string   `json:"id"`
		Name    string   `json:"name"`
		Score   *int     `json:"score"`
		Time    *float64 `json:"time"`
		Map     string   `json:"map"`
		Outcome string   `json:"outcome"`
	}
	if err := decoder.Decode(&input); err != nil {
		apiError(w, http.StatusBadRequest, "invalid score JSON or body exceeds 4096 bytes")
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		apiError(w, http.StatusBadRequest, "body must contain exactly one JSON object")
		return
	}
	if input.Score == nil || input.Time == nil {
		apiError(w, http.StatusBadRequest, "score and time are required")
		return
	}
	score := Score{ID: input.ID, Name: input.Name, Score: *input.Score, Time: *input.Time, Map: input.Map, Outcome: input.Outcome}
	score.Name = strings.TrimSpace(score.Name)
	if err := validate(score); err != nil {
		apiError(w, http.StatusBadRequest, err.Error())
		return
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	status := http.StatusCreated
	found := false
	for _, previous := range store.scores {
		if previous.ID != score.ID {
			continue
		}
		if previous != score {
			apiError(w, http.StatusConflict, "this run has already been saved with different data")
			return
		}
		found = true
		status = http.StatusOK
		break
	}
	if !found {
		next := append(append([]Score{}, store.scores...), score)
		sortScores(next)
		if err := store.persist(next); err != nil {
			log.Printf("score persistence failed: %v", err)
			apiError(w, http.StatusInternalServerError, "could not save score; please retry")
			return
		}
		store.scores = next
	}
	rank := 1
	for index, entry := range store.scores {
		if entry.ID == score.ID {
			rank = index + 1
			break
		}
	}
	percentile := math.Ceil(float64(rank) / float64(len(store.scores)) * 100)
	writeJSON(w, status, map[string]any{"score": score, "rank": rank, "percentile": percentile, "total": len(store.scores)})
}

func handler(root string, store *Store) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/api/scores", store)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) { apiError(w, 404, "unknown API route") })
	// Serve only public assets; score files, source specifications, and .git stay private.
	for _, directory := range []string{"src", "static"} {
		prefix := "/" + directory + "/"
		files := http.StripPrefix(prefix, http.FileServer(http.Dir(filepath.Join(root, directory))))
		mux.Handle(prefix, files)
	}
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		http.ServeFile(w, r, filepath.Join(root, "index.html"))
	})
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		mux.ServeHTTP(w, r)
	})
}

func main() {
	address := flag.String("addr", "127.0.0.1:8080", "HTTP listen address")
	root := flag.String("root", ".", "project directory containing index.html")
	data := flag.String("data", "data/scores.json", "persistent scoreboard file")
	flag.Parse()
	if _, err := os.Stat(filepath.Join(*root, "index.html")); err != nil {
		log.Fatal("project root must contain index.html: ", err)
	}
	store, err := openStore(*data)
	if err != nil {
		log.Fatal(err)
	}
	server := &http.Server{Addr: *address, Handler: handler(*root, store), ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("Space Invaders: http://%s", *address)
	log.Fatal(server.ListenAndServe())
}
