from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- User Schemas ---
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Resource Schemas ---
class ResourceOut(BaseModel):
    id: str
    name: str
    department: str
    cloud_account: str
    region: str
    workload_type: str
    current_instance_type: str
    monthly_cost: float
    risk_classification: str
    status: str
    last_simulated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Metric & Baseline Schemas ---
class MetricOut(BaseModel):
    id: int
    resource_id: str
    timestamp: datetime
    cpu_utilization: float
    memory_utilization: float
    request_volume: float
    average_latency: float
    p95_latency: float
    availability: float
    instance_type: str
    instance_price: float

    class Config:
        from_attributes = True

class BaselineMetrics(BaseModel):
    mean_cpu: float
    p95_cpu: float
    p99_cpu: float
    peak_cpu: float
    
    mean_memory: float
    p95_memory: float
    peak_memory: float
    
    avg_request_volume: float
    p95_request_volume: float
    peak_request_volume: float
    
    mean_latency: float
    p95_latency: float
    p99_latency: float
    
    availability: float

# --- Instance Catalog Schemas ---
class InstanceCatalogOut(BaseModel):
    id: int
    instance_type: str
    vcpu: int
    memory_gb: float
    hourly_price: float
    monthly_price: float
    network_capacity: str
    performance_score: float

    class Config:
        from_attributes = True

# --- Scenario Schemas ---
class ScenarioOut(BaseModel):
    id: str
    name: str
    description: str
    traffic_multiplier: float
    cpu_multiplier: float
    memory_multiplier: float
    latency_adder_ms: float
    availability_impact: float
    expected_result: str

    class Config:
        from_attributes = True

# --- Simulation Schemas ---
class SimulationRequest(BaseModel):
    resource_id: str
    scenario_id: str = "normal"
    candidate_instance_type: Optional[str] = None
    cpu_threshold: float = 75.0
    memory_threshold: float = 80.0
    latency_target: float = 250.0
    availability_target: float = 99.90
    safety_margin: float = 15.0
    min_savings: float = 10.0
    peak_multiplier: float = 1.0
    hours_per_month: int = 730

class SimulationResponse(BaseModel):
    id: Optional[int] = None
    resource_id: str
    scenario_id: str
    scenario_name: str
    current_instance_type: str
    candidate_instance_type: str
    
    current_vcpu: int
    candidate_vcpu: int
    current_memory_gb: float
    candidate_memory_gb: float
    
    current_monthly_cost: float
    candidate_monthly_cost: float
    monthly_savings: float
    annual_savings: float
    savings_pct: float
    
    baseline_cpu_p95: float
    predicted_cpu_p95: float
    cpu_target: float
    
    baseline_memory_p95: float
    predicted_memory_p95: float
    memory_target: float
    
    baseline_latency_p95: float
    predicted_latency_p95: float
    latency_target: float
    
    baseline_availability: float
    predicted_availability: float
    availability_target: float
    
    request_volume_baseline: float
    candidate_request_capacity: float
    
    decision: str  # SAFE TO RIGHTSIZE, REVIEW REQUIRED, KEEP CURRENT INSTANCE, HIGH RISK, BLOCKED
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: float
    reason: str
    detailed_explanation: List[str]
    warnings: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SensitivityAnalysisRequest(BaseModel):
    resource_id: str
    scenario_id: str = "normal"
    candidate_instance_type: Optional[str] = None
    
    # Range parameters to test
    cpu_thresholds: List[float] = [60.0, 70.0, 75.0, 80.0, 85.0]
    memory_thresholds: List[float] = [70.0, 75.0, 80.0, 85.0, 90.0]
    latency_targets: List[float] = [150.0, 200.0, 220.0, 250.0, 300.0]
    peak_multipliers: List[float] = [1.0, 1.25, 1.5, 1.75, 2.0]

class SensitivityAnalysisPoint(BaseModel):
    parameter: str
    value: float
    decision: str
    savings_pct: float
    predicted_latency: float
    predicted_cpu: float
    risk_level: str

class SensitivityAnalysisResponse(BaseModel):
    resource_id: str
    current_instance: str
    candidate_instance: str
    decision_changing_assumptions: List[str]
    sensitivity_data: List[SensitivityAnalysisPoint]

class ScenarioComparisonPoint(BaseModel):
    scenario_id: str
    scenario_name: str
    current_cost: float
    recommended_instance: str
    recommended_cost: float
    savings_monthly: float
    savings_pct: float
    predicted_latency_p95: float
    predicted_availability: float
    decision: str
    risk_level: str

class ScenarioComparisonResponse(BaseModel):
    resource_id: str
    resource_name: str
    scenarios: List[ScenarioComparisonPoint]

# --- Recommendation & Action Schemas ---
class RecommendationOut(BaseModel):
    id: int
    resource_id: str
    current_instance: str
    recommended_instance: str
    current_cost: float
    recommended_cost: float
    monthly_savings: float
    annual_savings: float
    savings_pct: float
    latency_baseline: float
    latency_predicted: float
    latency_target: float
    availability_baseline: float
    availability_predicted: float
    availability_target: float
    decision: str
    risk_level: str
    reason: str
    status: str
    override_instance: Optional[str] = None
    override_reason: Optional[str] = None
    overridden_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ManualOverrideRequest(BaseModel):
    selected_instance: str
    user: str
    reason: str
    approved_by: str = "Cloud Operations Manager"

class ActionResponse(BaseModel):
    success: bool
    message: str
    recommendation_id: int
    status: str

# --- Change & Rollback Schemas ---
class ChangeOut(BaseModel):
    id: int
    recommendation_id: Optional[int] = None
    resource_id: str
    old_instance: str
    new_instance: str
    previous_cost: float
    new_cost: float
    monthly_savings: float
    status: str
    risk_level: str
    approval_required: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    is_rolled_back: bool
    rolled_back_at: Optional[datetime] = None
    rolled_back_by: Optional[str] = None
    rollback_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApproveChangeRequest(BaseModel):
    approved_by: str
    comments: Optional[str] = None

class RollbackChangeRequest(BaseModel):
    rolled_back_by: str
    reason: str

# --- Audit Schemas ---
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user: str
    action: str
    resource_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    recommendation_id: Optional[int] = None
    reason: Optional[str] = None
    risk_level: str
    scenario_id: Optional[str] = None
    approval_status: Optional[str] = None

    class Config:
        from_attributes = True

# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    role: str
    recommendation_understandable: bool
    risk_explanation_useful: bool
    trust_simulator: bool
    comments: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    role: str
    recommendation_understandable: bool
    risk_explanation_useful: bool
    trust_simulator: bool
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & KPI Schemas ---
class DashboardKPISummary(BaseModel):
    total_resources: int
    current_monthly_cost: float
    optimized_monthly_cost: float
    potential_monthly_savings: float
    annual_savings: float
    savings_percentage: float
    resources_safe_count: int
    resources_review_count: int
    resources_high_risk_count: int
    resources_optimal_count: int

class DashboardChartData(BaseModel):
    cost_by_account: Dict[str, Dict[str, float]]
    cost_by_workload: Dict[str, Dict[str, float]]
    savings_by_department: Dict[str, float]
    recent_audit_logs: List[AuditLogOut]
