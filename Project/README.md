# IntelliSearch — High-Performance Autocomplete Engine

> **Sub-Millisecond Prefix Search & Top-K Ranking using an In-Memory Trie, Min-Heap, and MongoDB Persistence**  
> *Engineered from first principles with zero external Redis or Elasticsearch dependencies in V1.*

---

## 1. Executive Summary & Problem Statement

Standard full-text databases (such as PostgreSQL, MySQL, or MongoDB) implement prefix matching using regular expression scans (e.g. `db.collection.find({ term: /^prefix/i })`) or index range bounds. While functional for low-traffic CRUD applications, this pattern degrades under high-throughput autocomplete workloads:

1. **High Latency & Disk I/O:** Even with B-Tree indexes, high-frequency typing events (every 100–300 ms per user) generate thousands of concurrent queries. Database connection pool overhead, network round-trips, and disk page lookups cause latencies in the range of **25 ms – 200 ms**.
2. **Computational Overhead of Global Sorting:** Sorting thousands of candidate matches by popularity using `ORDER BY frequency DESC` forces the database engine to sort all matching rows, scaling at $O(C \log C)$ where $C$ is the number of candidate matches.
3. **Database Contention:** Search queries starve writes and core transactional operations.

### The IntelliSearch Solution

**IntelliSearch** bridges persistent storage and low-latency retrieval by pairing **MongoDB as the durable source of truth** with an **in-memory custom Trie** and a **bounded Min-Heap / PriorityQueue Top-K ranker**:
- **Prefix Traversal in $O(P)$ time**, where $P$ is the prefix character length.
- **Top-K Ranking in $O(C \log K)$ time**, eliminating naive array allocations and sorting overhead.
- **~53.3x Empirical Speedup**: Average query latency dropped from **30.169 ms** (MongoDB) to **0.566 ms** (In-Memory Trie + Top-K) across a 10,000-term dataset.

---

## 2. Architecture Overview

```
                      +---------------------------------------+
                      |       React 18 Frontend (Vite)        |
                      |   - Debounced Input (250 ms)          |
                      |   - Keyboard Navigation (Up/Down/Esc) |
                      |   - Prefix Visual Highlighting        |
                      |   - Live Latency Benchmark Badge      |
                      +-------------------+-------------------+
                                          |
                                          | REST API (HTTP)
                                          v
                      +---------------------------------------+
                      |         Express.js Backend            |
                      |   - Rate Limiter (IP-based)           |
                      |   - Helmet Security Headers           |
                      |   - Input Normalizer & Sanitizer      |
                      +---------+-------------------+---------+
                                |                   |
               Read Traffic     |                   | Write / Event Tracking
                                v                   v
             +-----------------------+   +-----------------------+
             |      TrieManager      |   |   Search & Analytics  |
             |   (In-Memory Engine)  |   |        Service        |
             +-----------+-----------+   +-----------+-----------+
                         |                           |
        +----------------+----------------+          |
        |                                 |          |
        v                                 v          v
+---------------+                 +---------------+  |
| Custom Trie   |                 | Top-K Ranker  |  |
| - Root Node   |                 | - Min-Heap    |  |
| - DFS Subtree |                 | - CTR Decay   |  |
+---------------+                 +---------------+  |
                                                     |
                                                     v
                                          +-----------------------+
                                          |   MongoDB (Local/Atlas)|
                                          | - SearchTerm (Truth)  |
                                          | - SearchEvent (Log)   |
                                          +-----------------------+
```

---

## 3. Core Data Structures & Algorithmic Mechanics

### 3.1 Custom In-Memory Trie (`server/src/algorithms/Trie.js`)
No external npm trie library is used. The data structure is implemented from first principles:
- **`TrieNode`**:
  - `char`: character represented.
  - `children`: `Map<string, TrieNode>` for fast pointer lookup with variable alphabet sizes (supporting spaces and punctuation).
  - `isEndOfWord`: boolean flag indicating whether the path terminates a canonical search term.
  - `term`: canonical lowercased string.
  - `metadata`: `{ frequency, clickCount, lastSearchedAt, createdAt }`.
- **Search Prefix (`searchPrefix(prefix)`):** Traverses the tree character by character. If any character link is missing, returns `null` in $O(P)$ time.
- **Subtree Candidate Collection (`collectCandidates(prefixNode)`):** Uses iterative Depth-First Search (DFS) with a memory ceiling (default 5,000) to collect candidates without exceeding the JavaScript call stack.
- **Node Pruning Deletion (`remove(term)`):** Recursively deletes characters and prunes branches that have no other children.

### 3.2 Bounded Min-Heap / PriorityQueue (`server/src/algorithms/PriorityQueue.js`)
A binary heap implemented over a flat array where parent index is `(i - 1) >> 1` and children are `(i << 1) + 1` and `(i << 1) + 2`:
- `push(item)`: $O(\log K)$ sift-up.
- `pop()`: $O(\log K)$ sift-down.
- `peek()`: $O(1)$ root inspection.

### 3.3 Top-K Ranking Engine (`server/src/algorithms/TopKRanker.js`)
Instead of copying and sorting all $C$ candidates ($O(C \log C)$), we maintain a **Min-Heap bounded to size $K$** (e.g. $K = 5$):
1. For each candidate in the matching subtree, compute its composite score.
2. If `heap.size() < K`, push the candidate ($O(\log K)$).
3. If `candidate.score > heap.peek().score`, replace the minimum element: `heap.pop()` followed by `heap.push(candidate)` ($O(\log K)$).
4. After examining all $C$ candidates, drain the heap and reverse.

**Time Complexity:** $\mathcal{O}(C \log K)$. When $C = 1,000$ and $K = 5$, $\log_2(5) \approx 2.32$ vs $\log_2(1000) \approx 9.97$, yielding a **>4x reduction in comparison operations** and zero large-array sorting copies.

### 3.4 Heuristic Ranking Formula
Suggestions are scored using a configurable weighted formula:

$$\text{Score} = w_{\text{freq}} \cdot S_{\text{freq}} + w_{\text{recency}} \cdot S_{\text{recency}} + w_{\text{click}} \cdot S_{\text{click}}$$

Where:
- $w_{\text{freq}} = 0.6$ (Search Frequency weight, normalized logarithmically via $\frac{\log_{10}(\text{freq} + 1)}{6}$ to dampen extreme outliers).
- $w_{\text{recency}} = 0.2$ (Exponential time decay over a 30-day half-life: $e^{-\Delta\text{days} / 30}$).
- $w_{\text{click}} = 0.2$ (Click-Through Rate heuristic bounded to $[0, 1]$: $\min(1, \frac{\text{clicks}}{\max(\text{freq}, 1)})$).

---

## 4. Empirical Performance Benchmarks

The benchmark suite (`node benchmark/benchmark.js`) executes 300 requests per method across multiple query prefixes against **10,000 real-world software engineering search terms** stored in MongoDB and indexed in the Trie.

### 4.1 Benchmark Results (Measured on Windows 11 / Node.js v22.14 / MongoDB Local)

| Strategy | Average Latency | Median (P50) | P95 Latency | P99 Latency | Throughput |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MongoDB Baseline (Regex)** | **30.169 ms** | 3.475 ms | 77.873 ms | 198.116 ms | ~33 req/s |
| **Trie Only (Subtree DFS)** | **0.463 ms** | 0.083 ms | 4.409 ms | 5.519 ms | ~2,158 req/s |
| **Trie + Min-Heap Top-K (Optimized)** | **0.566 ms** | **0.066 ms** | **5.714 ms** | **7.118 ms** | **~1,768 req/s** |

> **Summary:** The In-Memory Trie + Min-Heap Top-K is **~53.3x faster** than MongoDB baseline prefix queries.
> **Memory Overhead:** 10,000 terms (103,546 Trie nodes) consumed approximately **38.55 MB** of heap memory.
> **Trie Build Time:** Initialized from MongoDB in **186.44 ms**.

### 4.2 Concurrency & Thread-Safety Testing (`node benchmark/concurrency.js`)

Node.js executes JavaScript on a single thread with an asynchronous event loop. Because Trie lookups perform non-mutating reads and candidate collection does not modify tree pointers, concurrent queries are thread-safe and non-blocking:

| Concurrency Level | Requests Sent | Success Rate | Average Latency | Median (P50) | P95 Latency | Batch Throughput |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100 Concurrent** | 100 | **100% (0 failed)** | 0.709 ms | 0.053 ms | 5.066 ms | ~1,403 req/s |
| **500 Concurrent** | 500 | **100% (0 failed)** | 0.668 ms | 0.054 ms | 5.293 ms | ~1,492 req/s |
| **1000 Concurrent** | 1000 | **100% (0 failed)** | 0.707 ms | 0.055 ms | 5.973 ms | ~1,411 req/s |

**Integrity Verification:**
- Initial Trie nodes: `103,546` | Post-test Trie nodes: `103,546`
- State corruption: **0.0% (Passed)**

---

## 5. Time & Space Complexity Analysis

| Operation | Time Complexity | Auxiliary Space | Explanation |
| :--- | :--- | :--- | :--- |
| **Trie Insertion** | $\mathcal{O}(L)$ | $\mathcal{O}(L)$ worst-case | $L$ is term length. Creates at most $L$ character nodes. |
| **Trie Prefix Search** | $\mathcal{O}(P)$ | $\mathcal{O}(1)$ | $P$ is prefix length. Traverses exactly $P$ node pointers. |
| **Candidate Collection** | $\mathcal{O}(\vert V_{\text{sub}} \vert)$ | $\mathcal{O}(\text{MaxDepth})$ | Traverses the subtree of size $V_{\text{sub}}$ via DFS stack. |
| **Top-K Ranking** | $\mathcal{O}(C \log K)$ | $\mathcal{O}(K)$ | $C$ candidates tested against a bounded Min-Heap of size $K$. |
| **Naive Sort Alternative** | $\mathcal{O}(C \log C)$ | $\mathcal{O}(C)$ | Copies and sorts entire candidate array. |

---

## 6. Database Models & Schema Design

### 6.1 `SearchTerm` Collection
Stores canonical terms, cumulative popularity, and usage timestamps:
```javascript
{
  "_id": ObjectId("..."),
  "term": "java spring boot",        // indexed: unique, lowercase, trimmed
  "frequency": 15240,                 // indexed: used for baseline & scoring
  "clickCount": 8320,                 // total recommendation clicks
  "lastSearchedAt": ISODate("..."),   // indexed: recency decay score
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```
**Indexes:** `{ term: 1 }` (unique), `{ frequency: -1, term: 1 }`, `{ lastSearchedAt: 1 }`.

### 6.2 `SearchEvent` Collection
Stores raw search telemetry for analytics:
```javascript
{
  "_id": ObjectId("..."),
  "query": "jav",                     // user prefix query
  "selectedSuggestion": "java",       // suggestion clicked, or null
  "eventType": "SUGGESTION_CLICK",   // 'SEARCH' | 'SUGGESTION_CLICK'
  "timestamp": ISODate("..."),       // indexed
  "sessionId": "session_a1b2c3"       // indexed
}
```
**Indexes:** `{ eventType: 1, timestamp: -1 }`, `{ query: 1 }`.

---

## 7. REST API Documentation

### 7.1 Autocomplete Suggestions
- **`GET /api/search/suggestions?q=jav&limit=5`**
  - Rate limit: 120 req/min
  - **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "query": "jav",
      "suggestions": [
        {
          "text": "javascript",
          "score": 10450,
          "frequency": 24100,
          "clickCount": 14200
        },
        {
          "text": "java spring boot",
          "score": 9820,
          "frequency": 18200,
          "clickCount": 11500
        }
      ],
      "metadata": {
        "count": 2,
        "candidatesCount": 14,
        "processingTimeMs": 0.412
      }
    }
    ```

### 7.2 MongoDB Baseline (For Live Comparison)
- **`GET /api/search/baseline?q=jav&limit=5`**
  - Runs MongoDB regex query for real-time latency comparison.

### 7.3 Click Tracking
- **`POST /api/search/click`**
  - **Payload:**
    ```json
    {
      "query": "jav",
      "suggestion": "java spring boot",
      "sessionId": "session_xyz123"
    }
    ```
  - **Behavior:** Asynchronously increments `clickCount` (+1) and `frequency` (+2) in MongoDB, updating the in-memory Trie metadata in real-time.

### 7.4 Search Analytics
- `GET /api/analytics/overview`: Total searches, unique queries, overall CTR %, Trie node count, and process memory.
- `GET /api/analytics/popular?limit=10`: Most searched terms and most clicked recommendations.
- `GET /api/analytics/trends?days=7`: Daily search volume and click volume.
- `GET /api/analytics/zero-results`: Queries that yielded 0 matching suggestions.

### 7.5 Administration & Registry
- `GET /api/admin/terms?page=1&limit=10&search=...`: Paginated search terms.
- `POST /api/admin/terms`: Create term and sync to Trie.
- `DELETE /api/admin/terms/:id`: Delete term and prune from Trie.
- `POST /api/admin/trie/rebuild`: Force reload of the in-memory Trie from MongoDB.
- `GET /api/admin/stats`: In-memory Trie and process telemetry.
*(Protected by `x-admin-key: admin-secret-key-123`)*

---

## 8. Setup & Installation Guide

### Prerequisites
- **Node.js** >= 18.x (tested on v22.14.0)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### Step 1: Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository_url>
cd "Intellisearch - Search Optimization Project"

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Default configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/intellisearch
CLIENT_URL=http://localhost:5173

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=120

RANK_FREQUENCY_WEIGHT=0.6
RANK_RECENCY_WEIGHT=0.2
RANK_CLICK_WEIGHT=0.2

ADMIN_API_KEY=admin-secret-key-123
```

### Step 3: Seed Database (Deterministic Generator)
Populates MongoDB with 10,000 realistic tech terms and 5,000+ analytics events:
```bash
npm run seed
```

### Step 4: Run Tests
```bash
npm test
```
*Executes all 5 test suites (28 tests total): Unit tests for Trie, PriorityQueue, TopKRanker, API tests with Supertest, and End-to-End integration tests.*

### Step 5: Run Benchmarks
```bash
# Run latency percentile benchmarks (Mongo vs Trie vs Trie+TopK)
npm run benchmark

# Run concurrency stress tests (100, 500, 1000 simultaneous requests)
npm run concurrency
```

### Step 6: Start Full Application
```bash
npm run dev
```
- **Backend API:** `http://localhost:5000`
- **Frontend Dashboard:** `http://localhost:5173`

---

## 9. Production Scalability & V2 Distributed Roadmap

### Limitations of V1 (Single Node.js Process)
In the V1 architecture:
- Each Node.js process maintains its own independent in-memory Trie in RAM.
- If horizontally scaled behind a round-robin load balancer (Server A, Server B, Server C), a term update written to Server A updates Server A's Trie, but Server B and C remain unsynchronized until their next restart or poll.

### V2 Distributed Scalability Solutions
1. **Redis Pub/Sub Sync Mechanism:**
   When an admin updates a term or a click event fires on any Node instance, publish an event `trie:update` over Redis Pub/Sub. All running backend instances subscribe and apply incremental updates to their local in-memory Tries in $\mathcal{O}(L)$ time without rebuilding.
2. **Distributed Cache (Redis):**
   Hot search prefixes (e.g. `"java"`, `"react"`, `"python"`) can be cached in Redis with short TTLs (e.g. 60 seconds) to bypass Node.js entirely at the API Gateway layer.
3. **Change Streams (MongoDB):**
   Leverage MongoDB Replica Set Change Streams (`SearchTerm.watch()`) so backend instances automatically ingest and replicate external database modifications to their local Tries.
4. **Elasticsearch / OpenSearch for Typo-Tolerance:**
   For multi-gigabyte corpora requiring fuzzy phonetic matching (Levenshtein distance $\ge 2$), Elasticsearch can serve deep search while the in-memory Trie continues serving instantaneous zero-latency prefix suggestions.

---

## 10. SDE Resume Positioning & Interview Highlights

### Resume Bullet Points
- **Engineered an in-memory Trie autocomplete engine** with a bounded Min-Heap Top-K ranker in Node.js/Express, cutting prefix lookup latency by **53.3x** (0.56 ms vs 30.16 ms MongoDB baseline) across 10,000 indexed terms.
- **Formulated a multi-factor ranking heuristic** combining logarithmic frequency damping, 30-day exponential recency decay, and Click-Through Rate (CTR) tracking to deliver top-5 suggestions in $\mathcal{O}(C \log K)$ time.
- **Architected full-stack observability and analytics** using React, Tailwind CSS, Recharts, and MongoDB, visualizing CTR metrics, top queries, and real-time process memory telemetry.
- **Authored concurrency and benchmark test suites** verifying 1,000 simultaneous requests with 100% success rate, 0.055 ms median latency, and zero Trie state corruption under asynchronous load.

### Key Interview Discussion Topics
- **Why Min-Heap over Array.sort?** Reduces time complexity from $\mathcal{O}(C \log C)$ to $\mathcal{O}(C \log K)$ and saves memory allocations for large subtrees.
- **Trie Memory Trade-Off:** Trade ~38 MB of server RAM for sub-millisecond prefix searches without hitting disk I/O.
- **Consistency Model:** MongoDB acts as the ACID source of truth; in-memory Trie acts as the read-optimized index updated via coordinated write handlers.
