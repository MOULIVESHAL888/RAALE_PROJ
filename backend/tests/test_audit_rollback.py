import pytest
from app.models.models import Resource, Recommendation, Change, AuditLog
from app.services.recommendation_service import RecommendationService
from app.services.change_service import ChangeService
from app.services.audit_service import AuditService
from app.schemas.schemas import ManualOverrideRequest

def test_recommendation_accept_create_change_and_audit(db_session):
    rec = RecommendationService.generate_recommendations_for_resource(db_session, "res-pacs-01")
    assert rec is not None

    action_res = RecommendationService.accept_recommendation(db_session, rec.id, user="cloud.engineer")
    assert action_res.success is True

    # Check change record
    change = db_session.query(Change).filter(Change.recommendation_id == rec.id).first()
    assert change is not None

    # Check audit log
    audit = db_session.query(AuditLog).filter(AuditLog.recommendation_id == rec.id, AuditLog.action == "RECOMMENDATION_ACCEPTED").first()
    assert audit is not None
    assert audit.user == "cloud.engineer"

def test_manual_override_flow(db_session):
    rec = RecommendationService.generate_recommendations_for_resource(db_session, "res-pats-02")
    override_req = ManualOverrideRequest(
        selected_instance="t3.xlarge",
        user="lead.architect",
        reason="Overriding for specialized vCPU performance headroom requirement.",
        approved_by="Cloud Operations Manager"
    )

    res = RecommendationService.manual_override(db_session, rec.id, override_req)
    assert res.success is True

    # Check audit entry for MANUAL_OVERRIDE
    audit = db_session.query(AuditLog).filter(AuditLog.action == "MANUAL_OVERRIDE", AuditLog.recommendation_id == rec.id).first()
    assert audit is not None
    assert "t3.xlarge" in audit.new_value

def test_rollback_restores_previous_instance(db_session):
    resource = db_session.query(Resource).filter(Resource.id == "res-labs-05").first()
    orig_instance = resource.current_instance_type

    rec = RecommendationService.generate_recommendations_for_resource(db_session, "res-labs-05")
    action_res = RecommendationService.accept_recommendation(db_session, rec.id, user="ops.admin")

    change = db_session.query(Change).filter(Change.recommendation_id == rec.id).first()
    assert change is not None

    # Execute Rollback
    rb_change = ChangeService.rollback_change(db_session, change.id, rolled_back_by="ops.admin", reason="Unexpected latency increase observed in post-deployment baseline.")
    assert rb_change is not None
    assert rb_change.is_rolled_back is True
    assert rb_change.status == "ROLLED_BACK"

    # Verify resource restored to orig_instance
    db_session.refresh(resource)
    assert resource.current_instance_type == orig_instance

    # Check Audit log
    audit = db_session.query(AuditLog).filter(AuditLog.action == "ROLLBACK", AuditLog.resource_id == "res-labs-05").first()
    assert audit is not None
    assert audit.user == "ops.admin"

def test_audit_csv_export(db_session):
    csv_str = AuditService.export_csv(db_session)
    assert "ID,Timestamp,User,Action" in csv_str
    assert "SIMULATION_RUN" in csv_str or "RECOMMENDATION_ACCEPTED" in csv_str or "SYSTEM_INITIALIZED" in csv_str
