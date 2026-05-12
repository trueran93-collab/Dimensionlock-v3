import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Health and root checks
def test_api_root():
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    print("PASS: /api/ returns ok")

def test_api_health():
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "healthy"
    print("PASS: /api/health returns healthy")

# Scores
def test_get_top_scores_empty_or_list():
    r = requests.get(f"{BASE_URL}/api/scores/top")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"PASS: /api/scores/top returns list of {len(data)} scores")

def test_submit_score_and_verify():
    payload = {"player_name": "TEST_Player", "score": 9999, "floor": 5, "kills": 20}
    r = requests.post(f"{BASE_URL}/api/scores", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["player_name"] == "TEST_Player"
    assert data["score"] == 9999
    assert data["floor"] == 5
    assert data["kills"] == 20
    assert "id" in data
    assert "timestamp" in data
    print("PASS: /api/scores submit works")

def test_submitted_score_appears_in_top():
    payload = {"player_name": "TEST_TopPlayer", "score": 999999, "floor": 10, "kills": 50}
    requests.post(f"{BASE_URL}/api/scores", json=payload)
    r = requests.get(f"{BASE_URL}/api/scores/top")
    assert r.status_code == 200
    data = r.json()
    names = [d["player_name"] for d in data]
    assert "TEST_TopPlayer" in names
    print("PASS: Submitted score appears in top scores")
