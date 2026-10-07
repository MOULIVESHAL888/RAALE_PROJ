from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Resource, Recommendation, InstanceCatalog, Scenario, Metric
from app.schemas.schemas import SimulationRequest, ManualOverrideRequest, ActionResponse
from app.engines.baseline_engine import BaselineEngine
from app.engines.rightsizing_engine import RightsizingEngine
from app.services.audit_service import AuditService
from app.services.change_service import ChangeService

class RecommendationService:
    @staticmethod
    def generate_recommendations_for_resource(db: Session, resource_id: str) -> Optional[Recommendation]:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return None

        metrics = db.query(Metric).filter(Metric.resource_id == resource_id).all()
        current_instance = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == resource.current_instance_type).first()
        scenario = db.query(Scenario).filter(Scenario.id == "normal").first()

        if not current_instance or not scenario:
            return None

        baseline = BaselineEngine.calculate_baseline(metrics)
        candidates = db.query(InstanceCatalog).filter(InstanceCatalog.monthly_price < current_instance.monthly_price).order_by(InstanceCatalog.monthly_price.asc()).all()

        best_sim = None
        for cand in candidates:
            req = SimulationRequest(
                resource_id=resource.id,
                scenario_id="normal",
                candidate_instance_type=cand.instance_type
            )
            sim_res = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=cand,
                scenario=scenario,
                req=req,
                workload_type=resource.workload_type
            )
            if sim_res.decision == "SAFE TO RIGHTSIZE":
                best_sim = sim_res
                break  # Order asc by cost -> cheaper safe instance first

        if not best_sim:
            # Pick smallest price difference candidate for REVIEW
            cand = candidates[-1] if candidates else current_instance
            req = SimulationRequest(
                resource_id=resource.id,
                scenario_id="normal",
                candidate_instance_type=cand.instance_type
            )
            best_sim = RightsizingEngine.evaluate_candidate(
                baseline=baseline,
                current_instance=current_instance,
                candidate_instance=cand,
                scenario=scenario,
                req=req,
                workload_type=resource.workload_type
            )

        # Check existing recommendation
        existing = db.query(Recommendation).filter(
            Recommendation.resource_id == resource_id,
            Recommendation.status == "PENDING"
        ).first()

        if existing:
            rec = existing
            rec.recommended_instance = best_sim.candidate_instance_type
            rec.current_cost = best_sim.current_monthly_cost
            rec.recommended_cost = best_sim.candidate_monthly_cost
            rec.monthly_savings = best_sim.monthly_savings
            rec.annual_savings = best_sim.annual_savings
            rec.savings_pct = best_sim.savings_pct
            rec.latency_baseline = best_sim.baseline_latency_p95
            rec.latency_predicted = best_sim.predicted_latency_p95
            rec.latency_target = best_sim.latency_target
            rec.availability_baseline = best_sim.baseline_availability
            rec.availability_predicted = best_sim.predicted_availability
            rec.availability_target = best_sim.availability_target
            rec.decision = best_sim.decision
            rec.risk_level = best_sim.risk_level
            rec.reason = best_sim.reason
            rec.updated_at = datetime.utcnow()
        else:
            rec = Recommendation(
                resource_id=resource_id,
                current_instance=resource.current_instance_type,
                recommended_instance=best_sim.candidate_instance_type,
                current_cost=best_sim.current_monthly_cost,
                recommended_cost=best_sim.candidate_monthly_cost,
                monthly_savings=best_sim.monthly_savings,
                annual_savings=best_sim.annual_savings,
                savings_pct=best_sim.savings_pct,
                latency_baseline=best_sim.baseline_latency_p95,
                latency_predicted=best_sim.predicted_latency_p95,
                latency_target=best_sim.latency_target,
                availability_baseline=best_sim.baseline_availability,
                availability_predicted=best_sim.predicted_availability,
                availability_target=best_sim.availability_target,
                decision=best_sim.decision,
                risk_level=best_sim.risk_level,
                reason=best_sim.reason,
                status="PENDING"
            )
            db.add(rec)

        db.commit()
        db.refresh(rec)

        # Update resource status
        if best_sim.decision == "SAFE TO RIGHTSIZE":
            resource.status = "SAFE_TO_RIGHTSIZE"
        elif best_sim.decision == "REVIEW REQUIRED":
            resource.status = "REVIEW_REQUIRED"
        elif best_sim.decision in ["HIGH RISK", "BLOCKED"]:
            resource.status = "HIGH_RISK"
        else:
            resource.status = "OPTIMAL"

        resource.risk_classification = best_sim.risk_level
        db.commit()

        return rec

    @staticmethod
    def accept_recommendation(db: Session, rec_id: int, user: str = "cloud.engineer") -> ActionResponse:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return ActionResponse(success=False, message="Recommendation not found", recommendation_id=rec_id, status="ERROR")

        rec.status = "ACCEPTED"
        rec.updated_at = datetime.utcnow()

        # Create change record
        change = ChangeService.create_change_from_recommendation(db, rec, user=user)

        AuditService.log(
            db=db,
            user=user,
            action="RECOMMENDATION_ACCEPTED",
            resource_id=rec.resource_id,
            old_value=rec.current_instance,
            new_value=rec.recommended_instance,
            recommendation_id=rec.id,
            reason=f"Accepted rightsizing from {rec.current_instance} to {rec.recommended_instance} saving ${rec.monthly_savings:.2f}/mo.",
            risk_level=rec.risk_level,
            approval_status=change.status
        )

        return ActionResponse(
            success=True,
            message=f"Recommendation accepted. Change status: {change.status}.",
            recommendation_id=rec.id,
            status=rec.status
        )

    @staticmethod
    def reject_recommendation(db: Session, rec_id: int, user: str = "cloud.engineer", reason: str = "Rejected by operator") -> ActionResponse:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return ActionResponse(success=False, message="Recommendation not found", recommendation_id=rec_id, status="ERROR")

        rec.status = "REJECTED"
        rec.updated_at = datetime.utcnow()
        db.commit()

        AuditService.log(
            db=db,
            user=user,
            action="RECOMMENDATION_REJECTED",
            resource_id=rec.resource_id,
            old_value=rec.current_instance,
            new_value=rec.recommended_instance,
            recommendation_id=rec.id,
            reason=reason,
            risk_level=rec.risk_level
        )

        return ActionResponse(
            success=True,
            message="Recommendation rejected.",
            recommendation_id=rec.id,
            status=rec.status
        )

    @staticmethod
    def manual_override(db: Session, rec_id: int, req: ManualOverrideRequest) -> ActionResponse:
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            return ActionResponse(success=False, message="Recommendation not found", recommendation_id=rec_id, status="ERROR")

        old_instance = rec.recommended_instance
        rec.override_instance = req.selected_instance
        rec.override_reason = req.reason
        rec.overridden_by = req.user
        rec.status = "OVERRIDDEN"
        rec.recommended_instance = req.selected_instance
        rec.updated_at = datetime.utcnow()

        # Update cost calculation based on new instance
        cand_inst = db.query(InstanceCatalog).filter(InstanceCatalog.instance_type == req.selected_instance).first()
        if cand_inst:
            rec.recommended_cost = cand_inst.monthly_price
            rec.monthly_savings = rec.current_cost - rec.recommended_cost
            rec.annual_savings = rec.monthly_savings * 12.0
            rec.savings_pct = (rec.monthly_savings / rec.current_cost * 100.0) if rec.current_cost > 0 else 0.0

        db.commit()

        # Create change record
        change = ChangeService.create_change_from_recommendation(db, rec, user=req.user, is_override=True)

        AuditService.log(
            db=db,
            user=req.user,
            action="MANUAL_OVERRIDE",
            resource_id=rec.resource_id,
            old_value=old_instance,
            new_value=req.selected_instance,
            recommendation_id=rec.id,
            reason=f"Manual Override by {req.user}: {req.reason}. Approved by {req.approved_by}.",
            risk_level="HIGH",
            approval_status=change.status
        )

        return ActionResponse(
            success=True,
            message=f"Manual override applied. Selected instance {req.selected_instance}.",
            recommendation_id=rec.id,
            status=rec.status
        )
