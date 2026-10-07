from typing import Dict, Any, Tuple

class RiskEngine:
    @staticmethod
    def calculate_risk(
        savings_pct: float,
        predicted_cpu: float,
        cpu_target: float,
        predicted_memory: float,
        memory_target: float,
        predicted_latency: float,
        latency_target: float,
        predicted_avail: float,
        avail_target: float,
        workload_type: str = ""
    ) -> Tuple[str, float]:
        """
        Calculates Risk Level ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') and Risk Score (0-100).
        """
        score = 0.0

        # Cost savings component (High savings -> higher change impact)
        if savings_pct >= 50.0:
            score += 35
        elif savings_pct >= 30.0:
            score += 25
        elif savings_pct >= 15.0:
            score += 15
        else:
            score += 5

        # CPU proximity component
        cpu_headroom = cpu_target - predicted_cpu
        if cpu_headroom < 0:
            score += 30
        elif cpu_headroom < 5:
            score += 20
        elif cpu_headroom < 10:
            score += 10

        # Memory proximity component
        mem_headroom = memory_target - predicted_memory
        if mem_headroom < 0:
            score += 30
        elif mem_headroom < 5:
            score += 20
        elif mem_headroom < 10:
            score += 10

        # Latency SLA proximity component
        lat_headroom = latency_target - predicted_latency
        if lat_headroom < 0:
            score += 35
        elif lat_headroom < 20: # Within 20ms of SLA target
            score += 25
        elif lat_headroom < 50:
            score += 15

        # Availability proximity
        avail_gap = predicted_avail - avail_target
        if avail_gap < 0:
            score += 40
        elif avail_gap < 0.05:
            score += 20

        # Workload sensitivity boost
        critical_workloads = ["Emergency Department API", "Patient Records API", "PACS Medical Image Processing"]
        if any(cw.lower() in workload_type.lower() for cw in critical_workloads):
            score += 15

        # Cap score at 100
        risk_score = min(100.0, max(0.0, score))

        # Classification
        if risk_score >= 65.0 or lat_headroom < 0 or avail_gap < 0 or cpu_headroom < 0 or mem_headroom < 0:
            if "emergency" in workload_type.lower() or savings_pct >= 50.0 or lat_headroom < 0:
                risk_level = "CRITICAL"
            else:
                risk_level = "HIGH"
        elif risk_score >= 40.0:
            risk_level = "HIGH"
        elif risk_score >= 20.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return risk_level, round(risk_score, 1)
