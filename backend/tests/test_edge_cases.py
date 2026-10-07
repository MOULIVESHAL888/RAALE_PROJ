import pytest
from app.models.models import Metric, InstanceCatalog
from app.utils.edge_cases import EdgeCaseHandler

def test_edge_case_missing_metrics_detection(db_session):
    metrics = db_session.query(Metric).filter(Metric.resource_id == "res-logs-04").all()
    is_anomaly, warnings, meta = EdgeCaseHandler.inspect_metrics(metrics)
    assert is_anomaly is True
    assert any("Missing metric data" in w for w in warnings)

def test_edge_case_sudden_traffic_spike_detection():
    class MockMetric:
        def __init__(self, cpu, mem, req):
            self.cpu_utilization = cpu
            self.memory_utilization = mem
            self.request_volume = req

    # 960 normal metrics (1000 req/s) + 40 spike metrics (6000 req/s)
    metrics = [MockMetric(30.0, 40.0, 1000.0) for _ in range(960)] + [MockMetric(95.0, 90.0, 6000.0) for _ in range(40)]
    is_anomaly, warnings, meta = EdgeCaseHandler.inspect_metrics(metrics) # type: ignore
    assert is_anomaly is True
    assert any("Sudden extreme traffic spike" in w for w in warnings)

def test_edge_case_invalid_pricing_validation():
    invalid_catalog = InstanceCatalog(instance_type="fake.xlarge", vcpu=4, memory_gb=16, hourly_price=-0.05, monthly_price=-36.5, network_capacity="5Gbps", performance_score=100)
    is_valid, msg = EdgeCaseHandler.validate_instance_pricing(invalid_catalog)
    assert is_valid is False
    assert "Invalid pricing" in msg
