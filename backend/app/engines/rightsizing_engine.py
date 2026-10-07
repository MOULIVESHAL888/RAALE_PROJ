from typing import List, Dict, Any, Optional
from app.models.models import InstanceCatalog, Scenario, Metric
from app.schemas.schemas import BaselineMetrics, SimulationRequest, SimulationResponse
from app.engines.baseline_engine import BaselineEngine
from app.engines.risk_engine import RiskEngine

class RightsizingEngine:
    @staticmethod
    def evaluate_candidate(
        baseline: BaselineMetrics,
        current_instance: InstanceCatalog,
        candidate_instance: InstanceCatalog,
        scenario: Scenario,
        req: SimulationRequest,
        workload_type: str = ""
    ) -> SimulationResponse:
        # Scenario adjustments to baseline
        traffic_mult = scenario.traffic_multiplier * req.peak_multiplier
        cpu_mult = scenario.cpu_multiplier * req.peak_multiplier
        mem_mult = scenario.memory_multiplier * req.peak_multiplier
        latency_adder = scenario.latency_adder_ms
        avail_impact = scenario.availability_impact

        adjusted_cpu_p95 = baseline.p95_cpu * cpu_mult
        adjusted_mem_p95 = baseline.p95_memory * mem_mult
        adjusted_req_volume = baseline.p95_request_volume * traffic_mult
        adjusted_latency_p95 = baseline.p95_latency

        # Compute compute capacity ratios
        vcpu_ratio = max(0.1, candidate_instance.vcpu / float(current_instance.vcpu))
        mem_ratio = max(0.1, candidate_instance.memory_gb / float(current_instance.memory_gb))
        perf_ratio = max(0.1, candidate_instance.performance_score / float(current_instance.performance_score))

        # Predict CPU & Memory on candidate instance
        pred_cpu_p95 = adjusted_cpu_p95 / vcpu_ratio
        pred_mem_p95 = adjusted_mem_p95 / mem_ratio

        # Performance Impact Model for Latency
        # Utilization ratio based on bottleneck of CPU or Memory or overall capacity
        max_util = max(pred_cpu_p95, pred_mem_p95) / 100.0

        if max_util <= 0.5:
            latency_factor = 1.0 + (max_util * 0.15)
        elif max_util <= 0.8:
            latency_factor = 1.08 + ((max_util - 0.5) * 0.45) # 1.08 to 1.215
        elif max_util <= 0.95:
            latency_factor = 1.22 + ((max_util - 0.8) * 1.5)  # 1.22 to 1.445
        else: # Heavy contention
            latency_factor = 1.45 + ((max_util - 0.95) * 6.0)

        pred_latency_p95 = (adjusted_latency_p95 * latency_factor) + latency_adder

        # Availability Prediction
        pred_avail = max(0.0, min(100.0, baseline.availability + avail_impact))
        if pred_cpu_p95 > 90.0 or pred_mem_p95 > 95.0:
            pred_avail = max(90.0, pred_avail - 0.15)

        # Cost Calculations
        current_monthly = current_instance.hourly_price * req.hours_per_month
        candidate_monthly = candidate_instance.hourly_price * req.hours_per_month
        monthly_savings = current_monthly - candidate_monthly
        annual_savings = monthly_savings * 12.0
        savings_pct = (monthly_savings / current_monthly * 100.0) if current_monthly > 0 else 0.0

        # Capacity calculation
        candidate_req_capacity = current_instance.performance_score * 100.0 * perf_ratio

        # Threshold checks
        cpu_ok = pred_cpu_p95 <= req.cpu_threshold
        mem_ok = pred_mem_p95 <= req.memory_threshold
        latency_ok = pred_latency_p95 <= req.latency_target
        avail_ok = pred_avail >= req.availability_target
        savings_ok = savings_pct >= req.min_savings
        capacity_ok = pred_cpu_p95 <= 100.0 and pred_mem_p95 <= 100.0
        safety_margin_ok = (100.0 - max(pred_cpu_p95, pred_mem_p95)) >= req.safety_margin

        # Risk Engine evaluation
        risk_level, risk_score = RiskEngine.calculate_risk(
            savings_pct=savings_pct,
            predicted_cpu=pred_cpu_p95,
            cpu_target=req.cpu_threshold,
            predicted_memory=pred_mem_p95,
            memory_target=req.memory_threshold,
            predicted_latency=pred_latency_p95,
            latency_target=req.latency_target,
            predicted_avail=pred_avail,
            avail_target=req.availability_target,
            workload_type=workload_type
        )

        explanations = []
        warnings = []

        # Decision Matrix
        if candidate_instance.instance_type == current_instance.instance_type:
            decision = "KEEP CURRENT INSTANCE"
            reason = f"Candidate instance {candidate_instance.instance_type} is identical to current instance."
            explanations.append("No configuration change requested.")
        elif candidate_monthly >= current_monthly:
            decision = "KEEP CURRENT INSTANCE"
            reason = f"Candidate instance {candidate_instance.instance_type} (${candidate_monthly:.2f}/mo) is more expensive or equal to current (${current_monthly:.2f}/mo)."
            explanations.append("Rightsizing requires a cost reduction.")
        elif not capacity_ok:
            decision = "BLOCKED"
            reason = f"Candidate instance {candidate_instance.instance_type} cannot support workload demand. Predicted CPU ({pred_cpu_p95:.1f}%) or Memory ({pred_mem_p95:.1f}%) exceeds 100% capacity."
            warnings.append("Insufficient compute capacity for peak demand.")
            explanations.append(f"Workload demand requires higher vCPU ({current_instance.vcpu}) or Memory ({current_instance.memory_gb}GB).")
        elif cpu_ok and mem_ok and latency_ok and avail_ok and savings_ok and safety_margin_ok:
            decision = "SAFE TO RIGHTSIZE"
            reason = f"Expected monthly saving = {savings_pct:.1f}% (${monthly_savings:.2f}/mo). Performance and availability metrics remain comfortably within configured SLA targets."
            explanations.append(f"Historical CPU P95 = {baseline.p95_cpu:.1f}%, Predicted P95 = {pred_cpu_p95:.1f}% (Target <= {req.cpu_threshold:.1f}%).")
            explanations.append(f"Historical Memory P95 = {baseline.p95_memory:.1f}%, Predicted P95 = {pred_mem_p95:.1f}% (Target <= {req.memory_threshold:.1f}%).")
            explanations.append(f"Predicted P95 Latency = {pred_latency_p95:.1f}ms (Target <= {req.latency_target:.1f}ms).")
            explanations.append(f"Predicted Availability = {pred_avail:.2f}% (Target >= {req.availability_target:.2f}%).")
        elif not latency_ok:
            decision = "REVIEW REQUIRED" if risk_level != "CRITICAL" else "HIGH RISK"
            reason = f"Expected monthly saving = {savings_pct:.1f}% (${monthly_savings:.2f}/mo). However, predicted P95 latency increases to {pred_latency_p95:.1f}ms, violating the target of {req.latency_target:.1f}ms."
            warnings.append(f"Predicted P95 Latency ({pred_latency_p95:.1f}ms) exceeds SLA target ({req.latency_target:.1f}ms).")
            explanations.append("Automatic rightsizing is blocked due to latency SLA violation.")
        elif not cpu_ok or not mem_ok:
            decision = "REVIEW REQUIRED"
            viol_metric = "CPU" if not cpu_ok else "Memory"
            viol_val = pred_cpu_p95 if not cpu_ok else pred_mem_p95
            viol_tgt = req.cpu_threshold if not cpu_ok else req.memory_threshold
            reason = f"Expected monthly saving = {savings_pct:.1f}%. However, predicted {viol_metric} utilization ({viol_val:.1f}%) exceeds safety target ({viol_tgt:.1f}%)."
            warnings.append(f"Predicted {viol_metric} utilization ({viol_val:.1f}%) exceeds safety threshold.")
            explanations.append(f"System requires human review before applying {viol_metric}-pressured rightsizing.")
        elif not avail_ok:
            decision = "HIGH RISK"
            reason = f"Predicted availability ({pred_avail:.3f}%) drops below hospital minimum target ({req.availability_target:.2f}%)."
            warnings.append("Availability target violation detected.")
            explanations.append("Hospital clinical workloads require strict availability compliance.")
        elif not safety_margin_ok:
            decision = "REVIEW REQUIRED"
            reason = f"Safety margin threshold ({req.safety_margin:.1f}%) violated. Predicted peak utilization leaves insufficient headroom."
            warnings.append("Insufficient safety headroom.")
            explanations.append("Human approval required for low headroom downsizing.")
        else:
            decision = "REVIEW REQUIRED"
            reason = f"Minimum savings threshold ({req.min_savings:.1f}%) not met or risk requires human review."
            explanations.append("Savings do not justify operational risk of change.")

        return SimulationResponse(
            resource_id=current_instance.instance_type, # Placeholder will be set by caller
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            current_instance_type=current_instance.instance_type,
            candidate_instance_type=candidate_instance.instance_type,
            current_vcpu=current_instance.vcpu,
            candidate_vcpu=candidate_instance.vcpu,
            current_memory_gb=current_instance.memory_gb,
            candidate_memory_gb=candidate_instance.memory_gb,
            current_monthly_cost=round(current_monthly, 2),
            candidate_monthly_cost=round(candidate_monthly, 2),
            monthly_savings=round(monthly_savings, 2),
            annual_savings=round(annual_savings, 2),
            savings_pct=round(savings_pct, 1),
            baseline_cpu_p95=round(baseline.p95_cpu, 1),
            predicted_cpu_p95=round(pred_cpu_p95, 1),
            cpu_target=req.cpu_threshold,
            baseline_memory_p95=round(baseline.p95_memory, 1),
            predicted_memory_p95=round(pred_mem_p95, 1),
            memory_target=req.memory_threshold,
            baseline_latency_p95=round(baseline.p95_latency, 1),
            predicted_latency_p95=round(pred_latency_p95, 1),
            latency_target=req.latency_target,
            baseline_availability=round(baseline.availability, 4),
            predicted_availability=round(pred_avail, 4),
            availability_target=req.availability_target,
            request_volume_baseline=round(baseline.p95_request_volume, 0),
            candidate_request_capacity=round(candidate_req_capacity, 0),
            decision=decision,
            risk_level=risk_level,
            risk_score=risk_score,
            reason=reason,
            detailed_explanation=explanations,
            warnings=warnings
        )
