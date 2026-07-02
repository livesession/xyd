// Runtime smoke for the generated 3.unions SDK — copied next to client.go by
// goBuildSmoke and run with `go test ./...` (O2S_GO_SMOKE=1). It exercises the
// paths the golden test can't: discriminated-union decode (mapped variants +
// raw-JSON fallback), the const auto-fill on request marshaling, and the
// cursor/offset auto-pagers (GetNextPage continuation rules).
package uniondepot

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/example/uniondepot/option"
)

func TestDiscriminatedUnionDecode(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case strings.HasSuffix(r.URL.Path, "/circ"):
			w.Write([]byte(`{"type":"circle","radius":2.5}`))
		case strings.HasSuffix(r.URL.Path, "/sq"):
			w.Write([]byte(`{"type":"square","side":4}`))
		default:
			w.Write([]byte(`{"type":"hexagon","sides":6}`))
		}
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	ctx := context.Background()

	res, err := client.Shapes.Get(ctx, "circ")
	if err != nil {
		t.Fatalf("Get(circ): %v", err)
	}
	circle, ok := res.(Circle)
	if !ok {
		t.Fatalf("res = %T, want Circle", res)
	}
	if circle.Type != "circle" || circle.Radius != 2.5 {
		t.Errorf("circle = %+v", circle)
	}

	res, err = client.Shapes.Get(ctx, "sq")
	if err != nil {
		t.Fatalf("Get(sq): %v", err)
	}
	square, ok := res.(Square)
	if !ok {
		t.Fatalf("res = %T, want Square", res)
	}
	if square.Side != 4 {
		t.Errorf("square = %+v", square)
	}

	// Unknown discriminator value: the raw JSON is retained, not dropped.
	res, err = client.Shapes.Get(ctx, "mystery")
	if err != nil {
		t.Fatalf("Get(mystery): %v", err)
	}
	raw, ok := res.(json.RawMessage)
	if !ok {
		t.Fatalf("res = %T, want json.RawMessage fallback", res)
	}
	if !strings.Contains(string(raw), "hexagon") {
		t.Errorf("raw = %s", raw)
	}
}

func TestCursorAutoPager(t *testing.T) {
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Query().Get("after") {
		case "":
			// next_cursor present -> it wins over the last item's id.
			w.Write([]byte(`{"data":[{"id":"evt_1"},{"id":"evt_2"}],"has_more":true,"next_cursor":"tok_a"}`))
		case "tok_a":
			// no next_cursor -> the LAST item's id becomes the cursor.
			w.Write([]byte(`{"data":[{"id":"evt_3"}],"has_more":true}`))
		case "evt_3":
			w.Write([]byte(`{"data":[{"id":"evt_4"}],"has_more":false}`))
		default:
			t.Errorf("unexpected cursor %q", r.URL.Query().Get("after"))
			w.Write([]byte(`{"data":[],"has_more":false}`))
		}
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	var ids []string
	page, err := client.Events.List(context.Background(), EventListParams{})
	for page != nil && err == nil {
		for _, event := range page.Data {
			ids = append(ids, event.ID)
		}
		page, err = page.GetNextPage()
	}
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got := strings.Join(ids, ","); got != "evt_1,evt_2,evt_3,evt_4" {
		t.Errorf("ids = %s", got)
	}
	if requests != 3 {
		t.Errorf("requests = %d, want 3 (has_more=false stops without a 4th)", requests)
	}
}

func TestOffsetAutoPager(t *testing.T) {
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Query().Get("offset") {
		case "":
			w.Write([]byte(`{"data":[{"id":"log_1"},{"id":"log_2"}]}`))
		case "2":
			w.Write([]byte(`{"data":[{"id":"log_3"}]}`))
		case "3":
			// first empty page -> exhausted
			w.Write([]byte(`{"data":[]}`))
		default:
			t.Errorf("unexpected offset %q", r.URL.Query().Get("offset"))
			w.Write([]byte(`{"data":[]}`))
		}
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	var ids []string
	page, err := client.Logs.List(context.Background(), LogListParams{})
	for page != nil && err == nil {
		for _, log := range page.Data {
			ids = append(ids, log.ID)
		}
		page, err = page.GetNextPage()
	}
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if got := strings.Join(ids, ","); got != "log_1,log_2,log_3" {
		t.Errorf("ids = %s", got)
	}
	if requests != 3 {
		t.Errorf("requests = %d, want 3 (offset advances by len(data) per page)", requests)
	}
}

func TestConstAutoFill(t *testing.T) {
	if PublishEventRequestObjectConst != "event" {
		t.Errorf("PublishEventRequestObjectConst = %q", PublishEventRequestObjectConst)
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		payload, _ := io.ReadAll(r.Body)
		var body map[string]any
		if err := json.Unmarshal(payload, &body); err != nil {
			t.Fatalf("body: %v", err)
		}
		if got := body["object"]; got != "event" {
			t.Errorf("object = %v (want the auto-filled const)", got)
		}
		if got := body["name"]; got != "deploy" {
			t.Errorf("name = %v", got)
		}
		if _, ok := body["priority"]; ok {
			t.Errorf("absent param.Opt field should be omitted")
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"id":"evt_9","kind":"deploy"}`))
	}))
	defer server.Close()

	client := NewClient(option.WithBaseURL(server.URL))
	// Object left at its zero value: MarshalJSON fills the const.
	res, err := client.Events.New(context.Background(), EventNewParams{Name: "deploy"})
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if res.ID != "evt_9" {
		t.Errorf("res.ID = %q", res.ID)
	}
}
