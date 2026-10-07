from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Resource, Metric, InstanceCatalog, Scenario, Simulation
from app.schemas.schemas import SimulationRequest, SimulationResponse, SensitivityAnalysisRequest, SensitivityAnalysisResponse, ScenarioComparisonResponse
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine
from app.engines.scenario_engine import ScenarioEngine
from app.engines.sensitivity_engine import SensitivityEngine
from app.services.audit_service import AuditService
from app.utils.edge_cases import EdgeCaseHandler

class SimulationService:
    @staticmethod
    def run_simulation(db: Session, req: SimulationRequest, user: str = "cloud.engineer") -> SimulationResponse:
        resource = db.query(Resource).filter(Resource.id == req.resource_id).first()
        if not resource:
            raise ValueError(f"Resource {req.resource_id} not found.")

        scenario = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
        if not scenario:
            scenario = db.query(Scenario).filter(Scenario.id == "normal").first()

        current_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == resource.current_instance_type).first()
        if not current_instance:
            raise ValueError(f"Current instance type {resource.current_instance_type} not found in catalog.")

        # Candidate selection
        if req.candidate_instance_type:
            candidate_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == req.candidate_instance_type).first()
            if not candidate_instance:
                raise ValueError(f"Candidate instance type {req.candidate_instance_type} not found in catalog.")
        else:
            # Pick cheaper candidate
            cand = db.query(InstanceCatalog).filter(InstanceCatalog.monthly_price < current_instance.monthly_price).order_by(InstanceCatalog.monthly_price.asc()).first()
            candidate_instance = cand if cand else current_instance

        metrics = db.query(Metric).filter(Metric.resource_id == req.resource_id).all()
        
        # Edge case check
        is_anomaly, edge_warnings, _ = EdgeCaseHandler.inspect_metrics(metrics)

        baseline = BaselineEngine.calculate_baseline(metrics)

        sim_response = RightsizingEngine.evaluate_candidate(
            baseline=baseline,
            current_instance=current_instance,
            candidate_instance=candidate_instance,
            scenario=scenario,
            req=req,
            workload_type=resource.workload_type
        )
        sim_response.resource_id = resource.id

        # Attach edge case warnings if any
        if edge_warnings:
            sim_response.warnings.extend(edge_warnings)
            if is_anomaly and sim_response.decision == "SAFE TO RIGHTSIZE":
                sim_response.decision = "REVIEW REQUIRED"
                sim_response.reason += " (Data gap/anomaly detected; auto-rightsizing downgraded to REVIEW REQUIRED)."

        # Persist simulation log in DB
        sim_model = Simulation(
            resource_id=resource.id,
            scenario_id=scenario.id,
            candidate_instance_type=candidate_instance.instance_type,
            cpu_threshold=req.cpu_threshold,
            memory_threshold=req.memory_threshold,
            latency_target=req.latency_target,
            availability_target=req.availability_target,
            safety_margin=req.safety_margin,
            min_savings=req.min_savings,
            peak_multiplier=req.peak_multiplier,
            baseline_cpu_p95=sim_response.baseline_cpu_p95,
            candidate_cpu_pred=sim_response.predicted_cpu_p95,
            baseline_mem_p95=sim_response.baseline_memory_p95,
            candidate_mem_pred=sim_response.predicted_memory_p95,
            baseline_latency_p95=sim_response.baseline_latency_p95,
            candidate_latency_pred=sim_response.predicted_latency_p95,
            baseline_avail=sim_response.baseline_availability,
            candidate_avail_pred=sim_response.predicted_availability,
            current_cost=sim_response.current_monthly_cost,
            candidate_cost=sim_response.candidate_monthly_cost,
            monthly_savings=sim_response.monthly_savings,
            savings_pct=sim_response.savings_pct,
            decision=sim_response.decision,
            risk_score=sim_response.risk_score,
            reason=sim_response.reason
        )
        db.add(sim_model)

        resource.last_simulated_at = datetime.utcnow()
        db.commit()
        db.refresh(sim_model)
        sim_response.id = sim_model.id

        # Log audit
        AuditService.log(
            db=db,
            user=user,
            action="SIMULATION_RUN",
            resource_id=resource.id,
            old_value=current_instance.instance_type,
            new_value=candidate_instance.instance_type,
            reason=f"Executed simulation under {scenario.name}. Outcome: {sim_response.decision}.",
            risk_level=sim_response.risk_level,
            scenario_id=scenario.id
        )

        return sim_response

    @staticmethod
    def compare_scenarios(db: Session, resource_id: str, candidate_instance_type: Optional[str] = None) -> ScenarioComparisonResponse:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise ValueError(f"Resource {resource_id} not found.")

        current_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == resource.current_instance_type).first()
        if candidate_instance_type:
            candidate_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == candidate_instance_type).first()
        else:
            cand = db.query(InstanceCatalog).filter(InstanceCatalog.monthly_price < current_instance.monthly_price).order_by(InstanceCatalog.monthly_price.asc()).first()
            candidate_instance = cand if cand else current_instance

        metrics = db.query(Metric).filter(Metric.resource_id == resource_id).all()
        scenarios = db.query(Scenario).all()

        return ScenarioEngine.compare_scenarios(
            resource=resource,
            metrics=metrics,
            current_instance=current_instance,
            candidate_instance=candidate_instance,
            scenarios=scenarios
        )

    @staticmethod
    def run_sensitivity(db: Session, req: SensitivityAnalysisRequest) -> SensitivityAnalysisResponse:
        resource = db.query(Resource).filter(Resource.id == req.resource_id).first()
        if not resource:
            raise ValueError(f"Resource {req.resource_id} not found.")

        scenario = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
        current_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == resource.current_instance_type).first()

        if req.candidate_instance_type:
            candidate_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == req.candidate_instance_type).first()
        else:
            cand = db.query(InstanceCatalog).filter(InstanceCatalog.monthly_price < current_instance.monthly_price).order_by(InstanceCatalog.monthly_price.asc()).first()
            candidate_instance = cand if cand else current_instance

        metrics = db.query(Metric).filter(Metric.resource_id == req.resource_id).all()

        return SensitivityEngine.run_sensitivity(
            resource=resource,
            metrics=metrics,
            current_instance=current_instance,
            candidate_instance=candidate_instance,
            scenario=scenario,
            req=req
        )
