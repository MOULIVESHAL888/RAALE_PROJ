export interface Resource {
  id: string;
  name: string;
  department: string;
  cloud_account: string;
  region: string;
  workload_type: string;
  current_instance_type: string;
  monthly_cost: number;
  risk_classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPTIMAL' | 'SAFE_TO_RIGHTSIZE' | 'REVIEW_REQUIRED' | 'HIGH_RISK';
  last_simulated_at?: string;
  created_at: string;
}

export interface BaselineMetrics {
  mean_cpu: number;
  p95_cpu: number;
  p99_cpu: number;
  peak_cpu: number;
  mean_memory: number;
  p95_memory: number;
  peak_memory: number;
  avg_request_volume: number;
  p95_request_volume: number;
  peak_request_volume: number;
  mean_latency: number;
  p95_latency: number;
  p99_latency: number;
  availability: number;
}

export interface Metric {
  id: number;
  resource_id: string;
  timestamp: string;
  cpu_utilization: number;
  memory_utilization: number;
  request_volume: number;
  average_latency: number;
  p95_latency: number;
  availability: number;
  instance_type: string;
  instance_price: number;
}

export interface InstanceCatalog {
  id: number;
  instance_type: string;
  vcpu: number;
  memory_gb: number;
  hourly_price: number;
  monthly_price: number;
  network_capacity: string;
  performance_score: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  traffic_multiplier: number;
  cpu_multiplier: number;
  memory_multiplier: number;
  latency_adder_ms: number;
  availability_impact: number;
  expected_result: string;
}

export interface SimulationRequest {
  resource_id: string;
  scenario_id: string;
  candidate_instance_type?: string;
  cpu_threshold: number;
  memory_threshold: number;
  latency_target: number;
  availability_target: number;
  safety_margin: number;
  min_savings: number;
  peak_multiplier: number;
  hours_per_month?: number;
}

export interface SimulationResponse {
  id?: number;
  resource_id: string;
  scenario_id: string;
  scenario_name: string;
  current_instance_type: string;
  candidate_instance_type: string;
  current_vcpu: number;
  candidate_vcpu: number;
  current_memory_gb: number;
  candidate_memory_gb: number;
  current_monthly_cost: number;
  candidate_monthly_cost: number;
  monthly_savings: number;
  annual_savings: number;
  savings_pct: number;
  baseline_cpu_p95: number;
  predicted_cpu_p95: number;
  cpu_target: number;
  baseline_memory_p95: number;
  predicted_memory_p95: number;
  memory_target: number;
  baseline_latency_p95: number;
  predicted_latency_p95: number;
  latency_target: number;
  baseline_availability: number;
  predicted_availability: number;
  availability_target: number;
  request_volume_baseline: number;
  candidate_request_capacity: number;
  decision: 'SAFE TO RIGHTSIZE' | 'REVIEW REQUIRED' | 'KEEP CURRENT INSTANCE' | 'HIGH RISK' | 'BLOCKED';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  reason: string;
  detailed_explanation: string[];
  warnings: string[];
  created_at: string;
}

export interface SensitivityAnalysisRequest {
  resource_id: string;
  scenario_id?: string;
  candidate_instance_type?: string;
  cpu_thresholds?: number[];
  memory_thresholds?: number[];
  latency_targets?: number[];
  peak_multipliers?: number[];
}

export interface SensitivityAnalysisPoint {
  parameter: string;
  value: number;
  decision: string;
  savings_pct: number;
  predicted_latency: number;
  predicted_cpu: number;
  risk_level: string;
}

export interface SensitivityAnalysisResponse {
  resource_id: string;
  current_instance: string;
  candidate_instance: string;
  decision_changing_assumptions: string[];
  sensitivity_data: SensitivityAnalysisPoint[];
}

export interface ScenarioComparisonPoint {
  scenario_id: string;
  scenario_name: string;
  current_cost: number;
  recommended_instance: string;
  recommended_cost: number;
  savings_monthly: number;
  savings_pct: number;
  predicted_latency_p95: number;
  predicted_availability: number;
  decision: string;
  risk_level: string;
}

export interface ScenarioComparisonResponse {
  resource_id: string;
  resource_name: string;
  scenarios: ScenarioComparisonPoint[];
}

export interface Recommendation {
  id: number;
  resource_id: string;
  current_instance: string;
  recommended_instance: string;
  current_cost: number;
  recommended_cost: number;
  monthly_savings: number;
  annual_savings: number;
  savings_pct: number;
  latency_baseline: number;
  latency_predicted: number;
  latency_target: number;
  availability_baseline: number;
  availability_predicted: number;
  availability_target: number;
  decision: string;
  risk_level: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'OVERRIDDEN' | 'APPLIED' | 'ROLLED_BACK';
  override_instance?: string;
  override_reason?: string;
  overridden_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Change {
  id: number;
  recommendation_id?: number;
  resource_id: string;
  old_instance: string;
  new_instance: string;
  previous_cost: number;
  new_cost: number;
  monthly_savings: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'ROLLED_BACK';
  risk_level: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  is_rolled_back: boolean;
  rolled_back_at?: string;
  rolled_back_by?: string;
  rollback_reason?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  resource_id?: string;
  old_value?: string;
  new_value?: string;
  recommendation_id?: number;
  reason?: string;
  risk_level: string;
  scenario_id?: string;
  approval_status?: string;
}

export interface Feedback {
  id?: number;
  role: string;
  recommendation_understandable: boolean;
  risk_explanation_useful: boolean;
  trust_simulator: boolean;
  comments?: string;
  created_at?: string;
}

export interface DashboardKPISummary {
  total_resources: number;
  current_monthly_cost: number;
  optimized_monthly_cost: number;
  potential_monthly_savings: number;
  annual_savings: number;
  savings_percentage: number;
  resources_safe_count: number;
  resources_review_count: number;
  resources_high_risk_count: number;
  resources_optimal_count: number;
}

export interface DashboardData {
  summary: DashboardKPISummary;
  cost_by_account: Record<string, { current: number; optimized: number }>;
  cost_by_workload: Record<string, { current: number; optimized: number }>;
  savings_by_department: Record<string, number>;
  recent_audit_logs: AuditLog[];
}
