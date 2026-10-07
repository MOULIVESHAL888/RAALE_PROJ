from typing import List, Dict, Any
from app.models.models import Resource, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import (
    SensitivityAnalysisRequest,
    SensitivityAnalysisResponse,
    SensitivityAnalysisPoint,
    SimulationRequest,
    BaselineMetrics
)
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine

class SensitivityEngine:
    @staticmethod
    def run_sensitivity(
        resource: Resource,
        metrics: List[Metric],
        current_instance: InstanceCatalog,
        candidate_instance: InstanceCatalog,
        scenario: Scenario,
        req: SensitivityAnalysisRequest
    ) -> SensitivityAnalysisResponse:
        baseline = BaselineEngine.calculate_baseline(metrics)
        points: List[SensitivityAnalysisPoint] = []
        decision_changing_assumptions: List[str] = []

        # Default baseline simulation
        base_req = SimulationRequest(
            resource_id=resource.id,
            scenario_id=scenario.id,
            candidate_instance_type=candidate_instance.instance_type
        )
        base_res = RightsizingEngine.evaluate_candidate(
            baseline=baseline,
            current_instance=current_instance,
            candidate_instance=candidate_instance,
            scenario=scenario,
            req=base_req,
            workload_type=resource.workload_type
        )
        initial_decision = base_res.decision

        # 1. Test Latency targets
        prev_dec = initial_decision
        for lat_val in sorted(req.latency_targets):
            sim_req = SimulationRequest(
                resource_id=resource.id,
                scenario_id=scenario.id,
                candidate_instance_type=candidate_instance.instance_type,
                latency_target=lat_val
            )
            sim_res = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=candidate_instance,
                scenario=scenario,
                req=sim_req,
                workload_type=resource.workload_type
            )
            points.append(SensitivityAnalysisPoint(
                parameter="latency_target",
                value=lat_val,
                decision=sim_res.decision,
                savings_pct=sim_res.savings_pct,
                predicted_latency=sim_res.predicted_latency_p95,
                predicted_cpu=sim_res.predicted_cpu_p95,
                risk_level=sim_res.risk_level
            ))
            if sim_res.decision != prev_dec and lat_val != 250.0:
                decision_changing_assumptions.append(
                    f"The recommendation changes from '{prev_dec}' to '{sim_res.decision}' when P95 latency target is set to {lat_val:.0f}ms (predicted: {sim_res.predicted_latency_p95:.1f}ms)."
                )
                prev_dec = sim_res.decision

        # 2. Test CPU thresholds
        prev_dec = initial_decision
        for cpu_val in sorted(req.cpu_thresholds):
            sim_req = SimulationRequest(
                resource_id=resource.id,
                scenario_id=scenario.id,
                candidate_instance_type=candidate_instance.instance_type,
                cpu_threshold=cpu_val
            )
            sim_res = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=candidate_instance,
                scenario=scenario,
                req=sim_req,
                workload_type=resource.workload_type
            )
            points.append(SensitivityAnalysisPoint(
                parameter="cpu_threshold",
                value=cpu_val,
                decision=sim_res.decision,
                savings_pct=sim_res.savings_pct,
                predicted_latency=sim_res.predicted_latency_p95,
                predicted_cpu=sim_res.predicted_cpu_p95,
                risk_level=sim_res.risk_level
            ))
            if sim_res.decision != prev_dec and cpu_val != 75.0:
                decision_changing_assumptions.append(
                    f"The recommendation changes from '{prev_dec}' to '{sim_res.decision}' when CPU threshold is changed to {cpu_val:.0f}% (predicted: {sim_res.predicted_cpu_p95:.1f}%)."
                )
                prev_dec = sim_res.decision

        # 3. Test Peak Traffic Multipliers
        prev_dec = initial_decision
        for peak_val in sorted(req.peak_multipliers):
            sim_req = SimulationRequest(
                resource_id=resource.id,
                scenario_id=scenario.id,
                candidate_instance_type=candidate_instance.instance_type,
                peak_multiplier=peak_val
            )
            sim_res = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=candidate_instance,
                scenario=scenario,
                req=sim_req,
                workload_type=resource.workload_type
            )
            points.append(SensitivityAnalysisPoint(
                parameter="peak_multiplier",
                value=peak_val,
                decision=sim_res.decision,
                savings_pct=sim_res.savings_pct,
                predicted_latency=sim_res.predicted_latency_p95,
                predicted_cpu=sim_res.predicted_cpu_p95,
                risk_level=sim_res.risk_level
            ))
            if sim_res.decision != prev_dec and peak_val != 1.0:
                decision_changing_assumptions.append(
                    f"The recommendation changes from '{prev_dec}' to '{sim_res.decision}' when Peak Traffic Multiplier increases to {peak_val:.2f}x."
                )
                prev_dec = sim_res.decision

        # Deduplicate decision changing assumptions
        unique_assumptions = list(dict.fromkeys(decision_changing_assumptions))
        if not unique_assumptions:
            unique_assumptions.append(
                f"The recommendation remains robust as '{initial_decision}' across standard latency (150-300ms) and CPU threshold (60-85%) variations."
            )

        return SensitivityAnalysisResponse(
            resource_id=resource.id,
            current_instance=current_instance.instance_type,
            candidate_instance=candidate_instance.instance_type,
            decision_changing_assumptions=unique_assumptions,
            sensitivity_data=points
        )
