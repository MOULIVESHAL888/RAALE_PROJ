from typing import List, Tuple, Dict, Any, Optional
from app.models.models import Metric, InstanceCatalog

class EdgeCaseHandler:
    @staticmethod
    def inspect_metrics(metrics: List[Metric]) -> Tuple[bool, List[str], Dict[str, Any]]:
        """
        Inspects metrics for data anomalies: missing data, negative values, sudden traffic spikes.
        Returns: (has_warnings, warnings_list, sanitized_metadata)
        """
        warnings = []
        is_anomaly = False

        if not metrics:
            return True, ["Dataset is empty. Cannot generate reliable baseline."], {"missing_ratio": 1.0}

        total_points = len(metrics)
        expected_points = 90 * 24  # 90 days hourly = 2160
        missing_ratio = max(0.0, (expected_points - total_points) / float(expected_points))

        # Check for missing metric gaps
        if missing_ratio > 0.10: # More than 10% missing data
            is_anomaly = True
            warnings.append(f"Missing metric data detected ({missing_ratio*100:.1f}% data gap over 90 days). Automatic rightsizing is blocked; manual review required.")

        # Check negative or invalid metrics
        invalid_cpu = any(m.cpu_utilization < 0 or m.cpu_utilization > 100 for m in metrics)
        invalid_mem = any(m.memory_utilization < 0 or m.memory_utilization > 100 for m in metrics)
        if invalid_cpu or invalid_mem:
            is_anomaly = True
            warnings.append("Corrupted metric values detected (negative or >100% CPU/Memory). Data cleaned for simulation.")

        # Check for sudden traffic spikes (>4x ratio between peak and 95th percentile)
        req_vals = [m.request_volume for m in metrics if m.request_volume > 0]
        if req_vals:
            peak_req = max(req_vals)
            p95_req = sorted(req_vals)[int(len(req_vals) * 0.95)]
            if p95_req > 0 and (peak_req / float(p95_req)) >= 3.5:
                is_anomaly = True
                warnings.append(f"Sudden extreme traffic spike detected (Peak: {peak_req:.0f} req/s vs P95: {p95_req:.0f} req/s). Conservative safety margin enforced.")

        return is_anomaly, warnings, {"missing_ratio": round(missing_ratio, 3), "data_count": total_points}

    @staticmethod
    def validate_instance_pricing(candidate: InstanceCatalog) -> Tuple[bool, Optional[str]]:
        if candidate.hourly_price <= 0 or candidate.monthly_price <= 0:
            return False, f"Invalid pricing detected for instance {candidate.instance_type} (${candidate.hourly_price}/hr)."
        return True, None
