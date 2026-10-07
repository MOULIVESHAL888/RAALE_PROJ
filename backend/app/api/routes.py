from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.config import settings
from app.models.models import Resource, InstanceCatalog, Scenario, Recommendation, Change, AuditLog, Feedback
from app.schemas.schemas import (
    ResourceOut,
    MetricOut,
    BaselineMetrics,
    InstanceCatalogOut,
    ScenarioOut,
    SimulationRequest,
    SimulationResponse,
    SensitivityAnalysisRequest,
    SensitivityAnalysisResponse,
    ScenarioComparisonResponse,
    RecommendationOut,
    ManualOverrideRequest,
    ActionResponse,
    ChangeOut,
    ApproveChangeRequest,
    RollbackChangeRequest,
    AuditLogOut,
    FeedbackCreate,
    FeedbackOut,
    DashboardKPISummary
)
from app.services.resource_service import ResourceService
from app.services.simulation_service import SimulationService
from app.services.recommendation_service import RecommendationService
from app.services.change_service import ChangeService
from app.services.audit_service import AuditService
from app.services.feedback_service import FeedbackService

router = APIRouter()

from sqlalchemy import text

# --- Health Check ---
@router.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "version": settings.VERSION,
        "disclaimer": settings.SYNTHETIC_DATA_DISCLAIMER,
        "notice": settings.SIMULATION_ONLY_NOTICE
    }

# --- Resources & Metrics ---
@router.get("/resources", response_model=List[ResourceOut], tags=["Resources"])
def get_resources(db: Session = Depends(get_db)):
    return ResourceService.get_all_resources(db)

@router.get("/resources/{id}", response_model=ResourceOut, tags=["Resources"])
def get_resource(id: str, db: Session = Depends(get_db)):
    res = ResourceService.get_resource_by_id(db, id)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res

@router.get("/metrics/{resource_id}", tags=["Metrics"])
def get_metrics(resource_id: str, limit: int = Query(2160, le=5000), db: Session = Depends(get_db)):
    metrics = ResourceService.get_resource_metrics(db, resource_id, limit=limit)
    baseline = ResourceService.get_resource_baseline(db, resource_id)
    is_anomaly, warnings, meta = ResourceService.check_edge_cases(db, resource_id)

    return {
        "resource_id": resource_id,
        "metrics_count": len(metrics),
        "baseline": baseline,
        "anomaly_detected": is_anomaly,
        "warnings": warnings,
        "metadata": meta,
        "recent_metrics": [MetricOut.from_orm(m) for m in metrics[:100]]
    }

# --- Instance Catalog & Scenarios ---
@router.get("/instances", response_model=List[InstanceCatalogOut], tags=["Instances"])
def get_instances(db: Session = Depends(get_db)):
    return db.query(InstanceCatalog).order_by(InstanceCatalog.monthly_price.asc()).all()

@router.get("/scenarios", response_model=List[ScenarioOut], tags=["Scenarios"])
def get_scenarios(db: Session = Depends(get_db)):
    return db.query(Scenario).all()

# --- Simulation Engine ---
@router.post("/simulations", response_model=SimulationResponse, tags=["Simulations"])
def run_simulation(req: SimulationRequest, user: str = Query("cloud.engineer"), db: Session = Depends(get_db)):
    try:
        return SimulationService.run_simulation(db, req, user=user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scenario-comparison", response_model=ScenarioComparisonResponse, tags=["Simulations"])
def scenario_comparison(resource_id: str = Query(...), candidate_instance_type: Optional[str] = Query(None), db: Session = Depends(get_db)):
    try:
        return SimulationService.compare_scenarios(db, resource_id, candidate_instance_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sensitivity-analysis", response_model=SensitivityAnalysisResponse, tags=["Simulations"])
def sensitivity_analysis(req: SensitivityAnalysisRequest, db: Session = Depends(get_db)):
    try:
        return SimulationService.run_sensitivity(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Recommendations & Actions ---
@router.get("/recommendations", response_model=List[RecommendationOut], tags=["Recommendations"])
def get_recommendations(db: Session = Depends(get_db)):
    # Automatically ensure recommendations exist for all resources
    resources = ResourceService.get_all_resources(db)
    for r in resources:
        RecommendationService.generate_recommendations_for_resource(db, r.id)
    return db.query(Recommendation).order_by(Recommendation.id.desc()).all()

@router.get("/recommendations/resource/{resource_id}", response_model=RecommendationOut, tags=["Recommendations"])
def get_resource_recommendation(resource_id: str, db: Session = Depends(get_db)):
    rec = RecommendationService.generate_recommendations_for_resource(db, resource_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found for resource.")
    return rec

@router.post("/recommendations/{id}/accept", response_model=ActionResponse, tags=["Recommendations"])
def accept_recommendation(id: int, user: str = Query("cloud.engineer"), db: Session = Depends(get_db)):
    return RecommendationService.accept_recommendation(db, id, user=user)

@router.post("/recommendations/{id}/reject", response_model=ActionResponse, tags=["Recommendations"])
def reject_recommendation(id: int, user: str = Query("cloud.engineer"), reason: str = Query("Rejected by operator"), db: Session = Depends(get_db)):
    return RecommendationService.reject_recommendation(db, id, user=user, reason=reason)

@router.post("/recommendations/{id}/override", response_model=ActionResponse, tags=["Recommendations"])
def manual_override(id: int, req: ManualOverrideRequest, db: Session = Depends(get_db)):
    return RecommendationService.manual_override(db, id, req)

# --- Changes & Rollback ---
@router.get("/changes", response_model=List[ChangeOut], tags=["Changes"])
def get_changes(resource_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return ChangeService.get_changes(db, resource_id)

@router.post("/changes/{id}/approve", response_model=ChangeOut, tags=["Changes"])
def approve_change(id: int, req: ApproveChangeRequest, db: Session = Depends(get_db)):
    change = ChangeService.approve_change(db, id, approved_by=req.approved_by, comments=req.comments)
    if not change:
        raise HTTPException(status_code=400, detail="Change request cannot be approved or not found.")
    return change

@router.post("/changes/{id}/rollback", response_model=ChangeOut, tags=["Changes"])
def rollback_change(id: int, req: RollbackChangeRequest, db: Session = Depends(get_db)):
    change = ChangeService.rollback_change(db, id, rolled_back_by=req.rolled_back_by, reason=req.reason)
    if not change:
        raise HTTPException(status_code=400, detail="Change request cannot be rolled back or already rolled back.")
    return change

# --- Audit Logging ---
@router.get("/audit", response_model=List[AuditLogOut], tags=["Audit"])
def get_audit_logs(
    resource_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    return AuditService.get_logs(db, resource_id=resource_id, action=action, user=user, risk_level=risk_level, limit=limit)

@router.get("/audit/export", tags=["Audit"])
def export_audit_csv(db: Session = Depends(get_db)):
    csv_data = AuditService.export_csv(db)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit_trail.csv"})

# --- Stakeholder Feedback ---
@router.post("/feedback", response_model=FeedbackOut, tags=["Feedback"])
def submit_feedback(req: FeedbackCreate, db: Session = Depends(get_db)):
    return FeedbackService.create_feedback(db, req)

@router.get("/feedback", response_model=List[FeedbackOut], tags=["Feedback"])
def get_feedback(db: Session = Depends(get_db)):
    return FeedbackService.get_all_feedback(db)

# --- Executive Dashboard Summary ---
@router.get("/dashboard", tags=["Dashboard"])
def get_dashboard_data(db: Session = Depends(get_db)):
    resources = ResourceService.get_all_resources(db)
    
    # Generate recommendations to ensure fresh data
    for r in resources:
        RecommendationService.generate_recommendations_for_resource(db, r.id)
        
    recs = db.query(Recommendation).filter(Recommendation.status.in_(["PENDING", "ACCEPTED", "OVERRIDDEN"])).all()

    total_resources = len(resources)
    current_cost = sum(r.monthly_cost for r in resources)
    
    # Calculate optimized cost based on recommendations
    opt_cost = 0.0
    safe_cnt = 0
    review_cnt = 0
    risk_cnt = 0
    optimal_cnt = 0

    savings_by_dept = {}
    cost_by_account = {}
    cost_by_workload = {}

    for r in resources:
        dept = r.department
        account = r.cloud_account
        workload = r.workload_type
        
        rec = next((x for x in recs if x.resource_id == r.id), None)
        if rec and rec.decision == "SAFE TO RIGHTSIZE":
            rec_cost = rec.recommended_cost
            safe_cnt += 1
        elif rec and rec.decision == "REVIEW REQUIRED":
            rec_cost = rec.recommended_cost
            review_cnt += 1
        elif rec and rec.decision in ["HIGH RISK", "BLOCKED"]:
            rec_cost = r.monthly_cost
            risk_cnt += 1
        else:
            rec_cost = r.monthly_cost
            optimal_cnt += 1

        opt_cost += rec_cost
        sav = r.monthly_cost - rec_cost if r.monthly_cost > rec_cost else 0.0
        
        savings_by_dept[dept] = savings_by_dept.get(dept, 0.0) + sav
        
        if account not in cost_by_account:
            cost_by_account[account] = {"current": 0.0, "optimized": 0.0}
        cost_by_account[account]["current"] += r.monthly_cost
        cost_by_account[account]["optimized"] += rec_cost

        if workload not in cost_by_workload:
            cost_by_workload[workload] = {"current": 0.0, "optimized": 0.0}
        cost_by_workload[workload]["current"] += r.monthly_cost
        cost_by_workload[workload]["optimized"] += rec_cost

    potential_monthly_savings = max(0.0, current_cost - opt_cost)
    annual_savings = potential_monthly_savings * 12.0
    savings_pct = (potential_monthly_savings / current_cost * 100.0) if current_cost > 0 else 0.0

    recent_logs = AuditService.get_logs(db, limit=10)

    summary = DashboardKPISummary(
        total_resources=total_resources,
        current_monthly_cost=round(current_cost, 2),
        optimized_monthly_cost=round(opt_cost, 2),
        potential_monthly_savings=round(potential_monthly_savings, 2),
        annual_savings=round(annual_savings, 2),
        savings_percentage=round(savings_pct, 1),
        resources_safe_count=safe_cnt,
        resources_review_count=review_cnt,
        resources_high_risk_count=risk_cnt,
        resources_optimal_count=optimal_cnt
    )

    return {
        "summary": summary,
        "cost_by_account": cost_by_account,
        "cost_by_workload": cost_by_workload,
        "savings_by_department": savings_by_dept,
        "recent_audit_logs": [AuditLogOut.from_orm(l) for l in recent_logs]
    }
