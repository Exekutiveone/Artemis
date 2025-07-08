import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, REPO_ROOT)

from app import app


def test_api_aggregates():
    client = app.test_client()
    resp = client.get("/api/aggregates")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "by_weather" in data
    assert "by_terrain" in data
    assert isinstance(data["by_weather"], dict)
    assert isinstance(data["by_terrain"], dict)
    assert data["by_weather"]
    assert data["by_terrain"]
    first = next(iter(data["by_weather"].values()))
    assert "speed_m_s" in first
