import csv
import io
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogOut

class AuditService:
    @staticmethod
    def log(
        db: Session,
        user: str,
        action: str,
        resource_id: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        recommendation_id: Optional[int] = None,
        reason: Optional[str] = None,
        risk_level: str = "LOW",
        scenario_id: Optional[str] = None,
        approval_status: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            timestamp=datetime.utcnow(),
            user=user,
            action=action,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            recommendation_id=recommendation_id,
            reason=reason,
            risk_level=risk_level,
            scenario_id=scenario_id,
            approval_status=approval_status
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def get_logs(
        db: Session,
        resource_id: Optional[str] = None,
        action: Optional[str] = None,
        user: Optional[str] = None,
        risk_level: Optional[str] = None,
        limit: int = 100
    ) -> List[AuditLog]:
        query = db.query(AuditLog)
        if resource_id:
            query = query.filter(AuditLog.resource_id == resource_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if user:
            query = query.filter(AuditLog.user == user)
        if risk_level:
            query = query.filter(AuditLog.risk_level == risk_level)
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    @staticmethod
    def export_csv(db: Session) -> str:
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "ID", "Timestamp", "User", "Action", "Resource ID",
            "Old Value", "New Value", "Recommendation ID", "Reason",
            "Risk Level", "Scenario ID", "Approval Status"
        ])
        for l in logs:
            writer.writerow([
                l.id, l.timestamp.isoformat(), l.user, l.action, l.resource_id,
                l.old_value, l.new_value, l.recommendation_id, l.reason,
                l.risk_level, l.scenario_id, l.approval_status
            ])
        return output.getvalue()
