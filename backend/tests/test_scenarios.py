import pytest
from app.models.models import Resource, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import SimulationRequest
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine
from app.engines.scenario_engine import ScenarioEngine

def test_scenario_comparison_all_four_scenarios(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-emer-06").first()
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-emer-06").all()
    current_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.2xlarge").first()
    candidate_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.xlarge").first()
    scenarios = db_session.query(Scenario).all()

    comp = ScenarioEngine.compare_scenarios(
        resource=resource,
        metrics=metrics,
        current_instance=current_instance,
        candidate_instance=candidate_instance,
        scenarios=scenarios
    )

    assert len(comp.scenarios) == 4
    decisions = {p.scenario_id: p.decision for p in comp.scenarios}
    assert "normal" in decisions
    assert "peak" in decisions
    assert "bursty" in decisions
    assert "backup" in decisions

    # Peak or bursty scenario should have higher latency / risk than normal or backup
    normal_pt = next(p for p in comp.scenarios if p.scenario_id == "normal")
    peak_pt = next(p for p in comp.scenarios if p.scenario_id == "peak")
    assert peak_pt.predicted_latency_p95 > normal_pt.predicted_latency_p95

def test_scenario_backup_aggressive_rightsizing(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-back-03").first()
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-back-03").all()
    current_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.2xlarge").first()
    candidate_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.large").first() # 75% savings
    scenario = db_session.query(Scenario).filter(Scenario.id == "backup").first()

    baseline = BaselineEngine.calculate_baseline(metrics)
    req = SimulationRequest(
        resource_id=resource.id,
        scenario_id="backup",
        candidate_instance_type="m5.large"
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
    assert sim.savings_pct == 75.0
