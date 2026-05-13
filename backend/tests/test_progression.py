"""Tests for meta-progression endpoints (Phase 2 overhaul)."""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def _sid():
    return f"TEST_{uuid.uuid4().hex[:12]}"


# ── Health ────────────────────────────────────────────────────────────────
def test_health_returns_ok():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j.get("status") in ("ok", "healthy")


# ── GET /api/progress/{session_id} for brand-new id ───────────────────────
def test_get_progress_brand_new_session_returns_zeroed():
    sid = _sid()
    r = requests.get(f"{BASE_URL}/api/progress/{sid}", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j["session_id"] == sid
    assert j["death_shards"] == 0
    assert j["total_runs"] == 0
    assert j["total_kills"] == 0
    assert j["total_floors_cleared"] == 0
    assert j["achievements"] == []
    assert j["unlocks"] == {"startHpBoost": 0, "startSpBoost": 0, "dashCharges": 0, "ultStart": 0}
    assert j["best_run"]["floor"] == 0
    assert j["best_run"]["score"] == 0


# ── POST /api/progress/save: persist + monotonic max ──────────────────────
def test_save_progress_persists_and_monotonic():
    sid = _sid()
    # Initial save
    payload = {
        "session_id": sid,
        "death_shards": 50,
        "total_runs": 2,
        "total_kills": 10,
        "total_floors_cleared": 3,
        "best_run": {"floor": 3, "score": 1000, "kills": 10, "rank": "B", "best_combo": 7},
        "achievements": ["first_blood"],
    }
    r = requests.post(f"{BASE_URL}/api/progress/save", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["death_shards"] == 50
    assert j["total_runs"] == 2
    assert j["best_run"]["floor"] == 3
    assert j["best_run"]["score"] == 1000
    assert "first_blood" in j["achievements"]

    # GET to verify persistence
    r2 = requests.get(f"{BASE_URL}/api/progress/{sid}", timeout=10)
    assert r2.status_code == 200
    j2 = r2.json()
    assert j2["death_shards"] == 50
    assert j2["best_run"]["floor"] == 3

    # Attempt to lower best_run (should NOT overwrite)
    worse = {
        "session_id": sid,
        "best_run": {"floor": 1, "score": 100, "kills": 1, "rank": "D", "best_combo": 0},
        "total_runs": 1,  # less than current (2)
        "total_kills": 5,
    }
    r3 = requests.post(f"{BASE_URL}/api/progress/save", json=worse, timeout=10)
    assert r3.status_code == 200
    j3 = r3.json()
    assert j3["best_run"]["floor"] == 3, "best_run should NOT downgrade"
    assert j3["best_run"]["score"] == 1000
    assert j3["total_runs"] == 2, "total_runs should be monotonic-max"
    assert j3["total_kills"] == 10

    # Better best_run should overwrite
    better = {
        "session_id": sid,
        "best_run": {"floor": 5, "score": 4000, "kills": 25, "rank": "S", "best_combo": 20},
    }
    r4 = requests.post(f"{BASE_URL}/api/progress/save", json=better, timeout=10)
    assert r4.status_code == 200
    assert r4.json()["best_run"]["floor"] == 5
    assert r4.json()["best_run"]["score"] == 4000


# ── POST /api/progress/purchase: unlock costs & validation ────────────────
EXPECTED_COSTS = {
    'startHpBoost': [25, 60, 120, 200, 320],
    'startSpBoost': [20, 45, 90, 150, 240],
    'dashCharges':  [80, 220],
    'ultStart':     [40, 100, 180, 280],
}


def test_purchase_unlock_deducts_and_increments():
    sid = _sid()
    # Seed shards
    r = requests.post(f"{BASE_URL}/api/progress/save",
                      json={"session_id": sid, "death_shards": 100}, timeout=10)
    assert r.status_code == 200

    # Buy level 1 of startHpBoost (cost 25)
    r2 = requests.post(f"{BASE_URL}/api/progress/purchase",
                       json={"session_id": sid, "unlock_id": "startHpBoost"}, timeout=10)
    assert r2.status_code == 200, r2.text
    j = r2.json()
    assert j["unlocks"]["startHpBoost"] == 1
    assert j["death_shards"] == 75  # 100 - 25

    # Buy level 2 of startHpBoost (cost 60)
    r3 = requests.post(f"{BASE_URL}/api/progress/purchase",
                       json={"session_id": sid, "unlock_id": "startHpBoost"}, timeout=10)
    assert r3.status_code == 200
    j3 = r3.json()
    assert j3["unlocks"]["startHpBoost"] == 2
    assert j3["death_shards"] == 15  # 75 - 60


def test_purchase_insufficient_shards_returns_400():
    sid = _sid()
    # No shards — try to buy startSpBoost (cost 20)
    r = requests.post(f"{BASE_URL}/api/progress/purchase",
                      json={"session_id": sid, "unlock_id": "startSpBoost"}, timeout=10)
    assert r.status_code == 400
    assert "shard" in r.text.lower() or "enough" in r.text.lower()


def test_purchase_unknown_unlock_id_returns_400():
    sid = _sid()
    r = requests.post(f"{BASE_URL}/api/progress/purchase",
                      json={"session_id": sid, "unlock_id": "doesNotExist"}, timeout=10)
    assert r.status_code == 400
    assert "unknown" in r.text.lower() or "unlock_id" in r.text.lower()


def test_purchase_maxed_unlock_returns_400():
    sid = _sid()
    # Seed enough shards to max dashCharges (cost 80+220 = 300)
    requests.post(f"{BASE_URL}/api/progress/save",
                  json={"session_id": sid, "death_shards": 1000}, timeout=10)
    # Max it (2 levels)
    for _ in range(2):
        r = requests.post(f"{BASE_URL}/api/progress/purchase",
                          json={"session_id": sid, "unlock_id": "dashCharges"}, timeout=10)
        assert r.status_code == 200
    # 3rd attempt -> maxed
    r3 = requests.post(f"{BASE_URL}/api/progress/purchase",
                       json={"session_id": sid, "unlock_id": "dashCharges"}, timeout=10)
    assert r3.status_code == 400
    assert "max" in r3.text.lower()


# ── Leaderboard ───────────────────────────────────────────────────────────
def test_leaderboard_returns_top_list():
    sid = _sid()
    r = requests.get(f"{BASE_URL}/api/progress/{sid}/leaderboard", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert "top" in j
    assert isinstance(j["top"], list)
    assert j["session_id"] == sid


# ── Regression: scores endpoints still functional ─────────────────────────
def test_scores_regression_submit_and_top():
    payload = {"player_name": "TEST_RegPlayer", "score": 12345, "floor": 4, "kills": 12}
    r = requests.post(f"{BASE_URL}/api/scores", json=payload, timeout=10)
    assert r.status_code == 200
    assert r.json()["player_name"] == "TEST_RegPlayer"

    r2 = requests.get(f"{BASE_URL}/api/scores/top", timeout=10)
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)
