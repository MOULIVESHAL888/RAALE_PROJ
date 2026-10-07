import pytest

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_get_resources_endpoint(client):
    response = client.get("/api/resources")
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) == 8

def test_get_resource_by_id_endpoint(client):
    response = client.get("/api/resources/res-pacs-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "res-pacs-01"
    assert data["department"] == "Radiology Dept"

def test_get_metrics_endpoint(client):
    response = client.get("/api/metrics/res-pacs-01")
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "metrics_count" in data

def test_get_instances_and_scenarios(client):
    resp_inst = client.get("/api/instances")
    assert resp_inst.status_code == 200
    assert len(resp_inst.json()) >= 10

    resp_scen = client.get("/api/scenarios")
    assert resp_scen.status_code == 200
    assert len(resp_scen.json()) == 4

def test_simulation_api(client):
    payload = {
        "resource_id": "res-back-03",
        "scenario_id": "normal",
        "candidate_instance_type": "m5.xlarge",
        "cpu_threshold": 75.0,
        "memory_threshold": 80.0,
        "latency_target": 250.0
    }
    response = client.post("/api/simulations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "SAFE TO RIGHTSIZE"
    assert data["monthly_savings"] > 0

def test_get_recommendations_and_dashboard(client):
    resp_recs = client.get("/api/recommendations")
    assert resp_recs.status_code == 200
    assert len(resp_recs.json()) >= 8

    resp_dash = client.get("/api/dashboard")
    assert resp_dash.status_code == 200
    dash_data = resp_dash.json()
    assert "summary" in dash_data
    assert dash_data["summary"]["total_resources"] == 8

def test_submit_feedback(client):
    payload = {
        "role": "FinOps Analyst",
        "recommendation_understandable": True,
        "risk_explanation_useful": True,
        "trust_simulator": True,
        "comments": "The visual comparison of baseline vs predicted latency makes rightsizing decisions clear to non-technical stakeholders."
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "FinOps Analyst"
