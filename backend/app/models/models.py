from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(30), nullable=False, default="VIEWER")  # ADMIN, CLOUD_ENGINEER, REVIEWER, VIEWER
    full_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    cloud_account = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    workload_type = Column(String(100), nullable=False)
    current_instance_type = Column(String(50), nullable=False)
    monthly_cost = Column(Float, nullable=False, default=0.0)
    risk_classification = Column(String(20), default="LOW")
    status = Column(String(30), default="OPTIMAL") # OPTIMAL, SAFE_TO_RIGHTSIZE, REVIEW_REQUIRED, HIGH_RISK
    last_simulated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    metrics = relationship("Metric", back_populates="resource", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="resource", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="resource", cascade="all, delete-orphan")

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(50), ForeignKey("resources.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    cpu_utilization = Column(Float, nullable=False)
    memory_utilization = Column(Float, nullable=False)
    request_volume = Column(Float, nullable=False)
    average_latency = Column(Float, nullable=False)
    p95_latency = Column(Float, nullable=False)
    availability = Column(Float, nullable=False)
    instance_type = Column(String(50), nullable=False)
    instance_price = Column(Float, nullable=False)
    cloud_account = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    workload_type = Column(String(100), nullable=False)

    resource = relationship("Resource", back_populates="metrics")

class InstanceCatalog(Base):
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    instance_type = Column(String(50), unique=True, index=True, nullable=False)
    vcpu = Column(Integer, nullable=False)
    memory_gb = Column(Float, nullable=False)
    hourly_price = Column(Float, nullable=False)
    monthly_price = Column(Float, nullable=False)
    network_capacity = Column(String(50), nullable=False)
    performance_score = Column(Float, nullable=False)

class PricingHistory(Base):
    __tablename__ = "pricing_history"

    id = Column(Integer, primary_key=True, index=True)
    instance_type = Column(String(50), index=True, nullable=False)
    effective_date = Column(DateTime, nullable=False)
    hourly_price = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    cloud_provider = Column(String(50), default="AWS")

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    traffic_multiplier = Column(Float, default=1.0)
    cpu_multiplier = Column(Float, default=1.0)
    memory_multiplier = Column(Float, default=1.0)
    latency_adder_ms = Column(Float, default=0.0)
    availability_impact = Column(Float, default=0.0)
    expected_result = Column(Text, nullable=False)

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(50), ForeignKey("resources.id"), index=True, nullable=False)
    scenario_id = Column(String(50), nullable=False, default="normal")
    candidate_instance_type = Column(String(50), nullable=False)
    
    # Thresholds applied
    cpu_threshold = Column(Float, nullable=False)
    memory_threshold = Column(Float, nullable=False)
    latency_target = Column(Float, nullable=False)
    availability_target = Column(Float, nullable=False)
    safety_margin = Column(Float, nullable=False)
    min_savings = Column(Float, nullable=False)
    peak_multiplier = Column(Float, default=1.0)
    
    # Results
    baseline_cpu_p95 = Column(Float, nullable=False)
    candidate_cpu_pred = Column(Float, nullable=False)
    baseline_mem_p95 = Column(Float, nullable=False)
    candidate_mem_pred = Column(Float, nullable=False)
    baseline_latency_p95 = Column(Float, nullable=False)
    candidate_latency_pred = Column(Float, nullable=False)
    baseline_avail = Column(Float, nullable=False)
    candidate_avail_pred = Column(Float, nullable=False)
    
    current_cost = Column(Float, nullable=False)
    candidate_cost = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    savings_pct = Column(Float, nullable=False)
    
    decision = Column(String(30), nullable=False) # SAFE TO RIGHTSIZE, REVIEW REQUIRED, KEEP CURRENT INSTANCE, HIGH RISK, BLOCKED
    risk_score = Column(Float, default=0.0)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resource = relationship("Resource", back_populates="simulations")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(50), ForeignKey("resources.id"), index=True, nullable=False)
    current_instance = Column(String(50), nullable=False)
    recommended_instance = Column(String(50), nullable=False)
    current_cost = Column(Float, nullable=False)
    recommended_cost = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    annual_savings = Column(Float, nullable=False)
    savings_pct = Column(Float, nullable=False)
    
    latency_baseline = Column(Float, nullable=False)
    latency_predicted = Column(Float, nullable=False)
    latency_target = Column(Float, nullable=False)
    
    availability_baseline = Column(Float, nullable=False)
    availability_predicted = Column(Float, nullable=False)
    availability_target = Column(Float, nullable=False)
    
    decision = Column(String(30), nullable=False)
    risk_level = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    reason = Column(Text, nullable=False)
    status = Column(String(30), default="PENDING") # PENDING, ACCEPTED, REJECTED, OVERRIDDEN, APPLIED, ROLLED_BACK
    
    override_instance = Column(String(50), nullable=True)
    override_reason = Column(Text, nullable=True)
    overridden_by = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resource = relationship("Resource", back_populates="recommendations")
    changes = relationship("Change", back_populates="recommendation")

class Change(Base):
    __tablename__ = "changes"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=True)
    resource_id = Column(String(50), ForeignKey("resources.id"), nullable=False)
    old_instance = Column(String(50), nullable=False)
    new_instance = Column(String(50), nullable=False)
    previous_cost = Column(Float, nullable=False)
    new_cost = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    
    status = Column(String(30), default="PENDING_APPROVAL") # PENDING_APPROVAL, APPROVED, APPLIED, REJECTED, ROLLED_BACK
    risk_level = Column(String(20), nullable=False)
    approval_required = Column(Boolean, default=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    is_rolled_back = Column(Boolean, default=False)
    rolled_back_at = Column(DateTime, nullable=True)
    rolled_back_by = Column(String(100), nullable=True)
    rollback_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="changes")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False) # SIMULATION_RUN, RECOMMENDATION_GENERATED, RECOMMENDATION_ACCEPTED, RECOMMENDATION_REJECTED, MANUAL_OVERRIDE, APPROVAL, ROLLBACK, THRESHOLD_CHANGED, SCENARIO_CHANGED
    resource_id = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    recommendation_id = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    risk_level = Column(String(20), default="LOW")
    scenario_id = Column(String(50), nullable=True)
    approval_status = Column(String(30), nullable=True)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(100), nullable=False) # Cloud Engineer, Hospital IT Manager, FinOps Analyst, System Administrator
    recommendation_understandable = Column(Boolean, nullable=False)
    risk_explanation_useful = Column(Boolean, nullable=False)
    trust_simulator = Column(Boolean, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
