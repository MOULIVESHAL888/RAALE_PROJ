import axios from 'axios';
import {
  Resource,
  Metric,
  BaselineMetrics,
  InstanceCatalog,
  Scenario,
  SimulationRequest,
  SimulationResponse,
  SensitivityAnalysisRequest,
  SensitivityAnalysisResponse,
  ScenarioComparisonResponse,
  Recommendation,
  Change,
  AuditLog,
  Feedback,
  DashboardData
} from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => (await api.get('/health')).data;

export const getResources = async (): Promise<Resource[]> => (await api.get('/resources')).data;

export const getResourceById = async (id: string): Promise<Resource> => (await api.get(`/resources/${id}`)).data;

export const getResourceMetrics = async (resource_id: string, limit: number = 2160) =>
  (await api.get(`/metrics/${resource_id}?limit=${limit}`)).data;

export const getInstances = async (): Promise<InstanceCatalog[]> => (await api.get('/instances')).data;

export const getScenarios = async (): Promise<Scenario[]> => (await api.get('/scenarios')).data;

export const runSimulation = async (req: SimulationRequest, user: string = 'cloud.engineer'): Promise<SimulationResponse> =>
  (await api.post(`/simulations?user=${encodeURIComponent(user)}`, req)).data;

export const getScenarioComparison = async (resource_id: string, candidate_instance_type?: string): Promise<ScenarioComparisonResponse> =>
  (await api.post(`/scenario-comparison?resource_id=${resource_id}${candidate_instance_type ? `&candidate_instance_type=${candidate_instance_type}` : ''}`)).data;

export const getSensitivityAnalysis = async (req: SensitivityAnalysisRequest): Promise<SensitivityAnalysisResponse> =>
  (await api.post('/sensitivity-analysis', req)).data;

export const getRecommendations = async (): Promise<Recommendation[]> => (await api.get('/recommendations')).data;

export const getResourceRecommendation = async (resource_id: string): Promise<Recommendation> =>
  (await api.get(`/recommendations/resource/${resource_id}`)).data;

export const acceptRecommendation = async (id: number, user: string = 'cloud.engineer') =>
  (await api.post(`/recommendations/${id}/accept?user=${encodeURIComponent(user)}`)).data;

export const rejectRecommendation = async (id: number, user: string = 'cloud.engineer', reason: string = 'Rejected by operator') =>
  (await api.post(`/recommendations/${id}/reject?user=${encodeURIComponent(user)}&reason=${encodeURIComponent(reason)}`)).data;

export const manualOverrideRecommendation = async (id: number, selected_instance: string, reason: string, user: string, approved_by: string = 'Cloud Operations Manager') =>
  (await api.post(`/recommendations/${id}/override`, { selected_instance, user, reason, approved_by })).data;

export const getChanges = async (resource_id?: string): Promise<Change[]> =>
  (await api.get(`/changes${resource_id ? `?resource_id=${resource_id}` : ''}`)).data;

export const approveChange = async (id: number, approved_by: string, comments?: string) =>
  (await api.post(`/changes/${id}/approve`, { approved_by, comments })).data;

export const rollbackChange = async (id: number, rolled_back_by: string, reason: string) =>
  (await api.post(`/changes/${id}/rollback`, { rolled_back_by, reason })).data;

export const getAuditLogs = async (filters?: { resource_id?: string; action?: string; user?: string; risk_level?: string; limit?: number }): Promise<AuditLog[]> => {
  const params = new URLSearchParams();
  if (filters?.resource_id) params.append('resource_id', filters.resource_id);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.user) params.append('user', filters.user);
  if (filters?.risk_level) params.append('risk_level', filters.risk_level);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  return (await api.get(`/audit?${params.toString()}`)).data;
};

export const exportAuditCsv = () => `${API_BASE}/audit/export`;

export const submitFeedback = async (feedback: Feedback) => (await api.post('/feedback', feedback)).data;

export const getFeedback = async (): Promise<Feedback[]> => (await api.get('/feedback')).data;

export const getDashboardData = async (): Promise<DashboardData> => (await api.get('/dashboard')).data;

export default api;
