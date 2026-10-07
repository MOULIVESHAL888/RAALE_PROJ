from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Change, Recommendation, Resource, InstanceCatalog
from app.services.audit_service import AuditService

class ChangeService:
    @staticmethod
    def create_change_from_recommendation(
        db: Session,
        rec: Recommendation,
        user: str = "cloud.engineer",
        is_override: bool = False
    ) -> Change:
        approval_req = rec.risk_level in ["HIGH", "CRITICAL"] or rec.savings_pct >= 30.0 or is_override
        initial_status = "PENDING_APPROVAL" if approval_req else "APPROVED"

        change = Change(
            recommendation_id=rec.id,
            resource_id=rec.resource_id,
            old_instance=rec.current_instance,
            new_instance=rec.recommended_instance,
            previous_cost=rec.current_cost,
            new_cost=rec.recommended_cost,
            monthly_savings=rec.monthly_savings,
            status=initial_status,
            risk_level=rec.risk_level,
            approval_required=approval_req,
            approved_by=user if not approval_req else None,
            approved_at=datetime.utcnow() if not approval_req else None
        )
        db.add(change)
        db.commit()
        db.refresh(change)

        # If auto-approved, update resource state
        if initial_status == "APPROVED":
            ChangeService.apply_change_to_resource(db, change, user=user)

        return change

    @staticmethod
    def approve_change(db: Session, change_id: int, approved_by: str, comments: Optional[str] = None) -> Optional[Change]:
        change = db.query(Change).filter(Change.id == change_id).first()
        if not change or change.status != "PENDING_APPROVAL":
            return None

        change.status = "APPROVED"
        change.approved_by = approved_by
        change.approved_at = datetime.utcnow()
        db.commit()

        # Apply to resource (simulation update)
        ChangeService.apply_change_to_resource(db, change, user=approved_by)

        AuditService.log(
            db=db,
            user=approved_by,
            action="APPROVAL",
            resource_id=change.resource_id,
            old_value=change.old_instance,
            new_value=change.new_instance,
            recommendation_id=change.recommendation_id,
            reason=f"Approved change request #{change.id}. Comments: {comments or 'None'}",
            risk_level=change.risk_level,
            approval_status="APPROVED"
        )

        return change

    @staticmethod
    def apply_change_to_resource(db: Session, change: Change, user: str = "system") -> None:
        resource = db.query(Resource).filter(Resource.id == change.resource_id).first()
        if resource:
            resource.current_instance_type = change.new_instance
            resource.monthly_cost = change.new_cost
            resource.status = "OPTIMAL"
            db.commit()
            change.status = "APPLIED"
            db.commit()

    @staticmethod
    def rollback_change(db: Session, change_id: int, rolled_back_by: str, reason: str) -> Optional[Change]:
        change = db.query(Change).filter(Change.id == change_id).first()
        if not change or change.is_rolled_back:
            return None

        resource = db.query(Resource).filter(Resource.id == change.resource_id).first()
        if not resource:
            return None

        # Restore previous instance and cost
        old_inst_type = resource.current_instance_type
        resource.current_instance_type = change.old_instance
        resource.monthly_cost = change.previous_cost
        resource.status = "REVIEW_REQUIRED"

        # Update change record
        change.is_rolled_back = True
        change.rolled_back_at = datetime.utcnow()
        change.rolled_back_by = rolled_back_by
        change.rollback_reason = reason
        change.status = "ROLLED_BACK"

        # Update recommendation status if exists
        if change.recommendation_id:
            rec = db.query(Recommendation).filter(Recommendation.id == change.recommendation_id).first()
            if rec:
                rec.status = "ROLLED_BACK"

        db.commit()
        db.refresh(change)

        AuditService.log(
            db=db,
            user=rolled_back_by,
            action="ROLLBACK",
            resource_id=change.resource_id,
            old_value=old_inst_type,
            new_value=change.old_instance,
            recommendation_id=change.recommendation_id,
            reason=f"Rollback requested by {rolled_back_by}: {reason}. Restored instance {change.old_instance} (${change.previous_cost:.2f}/mo).",
            risk_level=change.risk_level,
            approval_status="ROLLED_BACK"
        )

        return change

    @staticmethod
    def get_changes(db: Session, resource_id: Optional[str] = None) -> List[Change]:
        query = db.query(Change)
        if resource_id:
            query = query.filter(Change.resource_id == resource_id)
        return query.order_by(Change.created_at.desc()).all()
