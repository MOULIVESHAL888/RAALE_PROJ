from typing import List
from app.models.models import Resource, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import ScenarioComparisonPoint, ScenarioComparisonResponse, SimulationRequest, BaselineMetrics
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine

class ScenarioEngine:
    @staticmethod
    def compare_scenarios(
        resource: Resource,
        metrics: List[Metric],
        current_instance: InstanceCatalog,
        candidate_instance: InstanceCatalog,
        scenarios: List[Scenario]
    ) -> ScenarioComparisonResponse:
        baseline = BaselineEngine.calculate_baseline(metrics)
        points: List[ScenarioComparisonPoint] = []

        for scenario in scenarios:
            req = SimulationRequest(
                resource_id=resource.id,
                scenario_id=scenario.id,
                candidate_instance_type=candidate_instance.instance_type
            )
            sim_res = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=candidate_instance,
                scenario=scenario,
                req=req,
                workload_type=resource.workload_type
            )

            points.append(ScenarioComparisonPoint(
                scenario_id=scenario.id,
                scenario_name=scenario.name,
                current_cost=sim_res.current_monthly_cost,
                recommended_instance=sim_res.candidate_instance_type,
                recommended_cost=sim_res.candidate_monthly_cost,
                savings_monthly=sim_res.monthly_savings,
                savings_pct=sim_res.savings_pct,
                predicted_latency_p95=sim_res.predicted_latency_p95,
                predicted_availability=sim_res.predicted_availability,
                decision=sim_res.decision,
                risk_level=sim_res.risk_level
            ))

        return ScenarioComparisonResponse(
            resource_id=resource.id,
            resource_name=resource.name,
            scenarios=points
        )
