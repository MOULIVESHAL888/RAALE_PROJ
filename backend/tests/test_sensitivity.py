import pytest
from app.models.models import Resource, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import SensitivityAnalysisRequest
from app.engines.sensitivity_engine import SensitivityEngine
from app.engines.baseline_engine import BaselineEngine

def test_sensitivity_engine_sweeps(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-pats-02").first()
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-pats-02").all()
    current_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.xlarge").first()
    candidate_instance = db_session.query(InstanceCatalog).filter(InstanceCatalog.instance_type == "m5.large").first()
    scenario = db_session.query(Scenario).filter(Scenario.id == "normal").first()

    req = SensitivityAnalysisRequest(
        resource_id=resource.id,
        scenario_id="normal",
        candidate_instance_type="m5.large",
        latency_targets=[120.0, 180.0, 250.0],
        cpu_thresholds=[60.0, 75.0, 85.0]
    )

    res = SensitivityEngine.run_sensitivity(
        resource=resource,
        metrics=metrics,
        current_instance=current_instance,
        candidate_instance=candidate_instance,
        scenario=scenario,
        req=req
    )

    assert len(res.sensitivity_data) > 0
    assert len(res.decision_changing_assumptions) > 0
