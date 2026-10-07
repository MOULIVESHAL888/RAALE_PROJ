import pytest
from app.models.models import Resource, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import SimulationRequest, BaselineMetrics
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine
from app.engines.risk_engine import RiskEngine

def test_baseline_engine_calculation(db_session):
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-pacs-01").all()
    assert len(metrics) > 0
    baseline = BaselineEngine.calculate_baseline(metrics)
    assert baseline.mean_cpu > 0
    assert baseline.p95_cpu >= baseline.mean_cpu
    assert baseline.p99_cpu >= baseline.p95_cpu
    assert baseline.peak_cpu >= baseline.p99_cpu
    assert baseline.p95_memory > 0
    assert baseline.p95_latency > 0
    assert baseline.availability >= 99.0

def test_rightsizing_safe_recommendation(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-back-03").first()
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-back-03").all()
    current_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.2xlarge").first()
    candidate_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.xlarge").first()
    scenario = db_session.query(Scenario).filter(Scenario.id == "normal").first()

    baseline = BaselineEngine.calculate_baseline(metrics)
    req = SimulationRequest(
        resource_id=resource.id,
        scenario_id="normal",
        candidate_instance_type="m5.xlarge"
    )

    sim = RightsizingEngine.evaluate_candidate(
        baseline=baseline,
        current_instance=current_instance,
        candidate_instance=candidate_instance,
        scenario=scenario,
        req=req,
        workload_type=resource.workload_type
    )

    assert sim.decision == "SAFE TO RIGHTSIZE"
    assert sim.monthly_savings > 0
    assert sim.savings_pct == 50.0

def test_rightsizing_insufficient_capacity_blocked(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-emer-06").first()
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-emer-06").all()
    current_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.2xlarge").first()
    tiny_candidate = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "t3.micro").first()
    scenario = db_session.query(Scenario).filter(Scenario.id == "normal").first()

    baseline = BaselineEngine.calculate_baseline(metrics)
    req = SimulationRequest(
        resource_id=resource.id,
        scenario_id="normal",
        candidate_instance_type="t3.micro"
    )

    sim = RightsizingEngine.evaluate_candidate(
        baseline=baseline,
        current_instance=current_instance,
        candidate_instance=tiny_candidate,
        scenario=scenario,
        req=req,
        workload_type=resource.workload_type
    )

    assert sim.decision == "BLOCKED"
    assert sim.predicted_cpu_p95 > 100.0 or sim.predicted_memory_p95 > 100.0

def test_risk_engine_classification():
    risk_level, score = RiskEngine.calculate_risk(
        savings_pct=50.0,
        predicted_cpu=70.0,
        cpu_target=75.0,
        predicted_memory=75.0,
        memory_target=80.0,
        predicted_latency=210.0,
        latency_target=250.0,
        predicted_avail=99.95,
        avail_target=99.90,
        workload_type="General Workload"
    )
    assert risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert 0 <= score <= 100
