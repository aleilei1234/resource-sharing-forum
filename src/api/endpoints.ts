import { apiClient } from './client';
import type { Comment, Demand, ListParams, PagedResult, ProfileSummary, ReportTarget, Resource, User } from '../types';

export async function login(values: { account: string; password: string }) {
  const { data } = await apiClient.post<{ token: string; user: User }>('/auth/login', values);
  return data;
}

export async function register(values: { username: string; email: string; password: string }) {
  const { data } = await apiClient.post<{ token: string; user: User }>('/auth/register', values);
  return data;
}

export async function resetPassword(values: { email: string; code: string; password: string }) {
  const { data } = await apiClient.post<{ ok: boolean }>('/auth/reset-password', values);
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<User>('/me');
  return data;
}

export async function updateMe(values: Partial<User>) {
  const { data } = await apiClient.put<User>('/me', values);
  return data;
}

export async function changePassword(values: { oldPassword: string; newPassword: string }) {
  const { data } = await apiClient.post<{ ok: boolean; passwordUpdatedAt: string }>('/me/password', values);
  return data;
}

export async function bindEmail(values: { email: string; code: string }) {
  const { data } = await apiClient.post<User>('/me/email', values);
  return data;
}

export async function getProfileSummary() {
  const { data } = await apiClient.get<ProfileSummary>('/me/summary');
  return data;
}

export async function getResources(params: ListParams) {
  const { data } = await apiClient.get<PagedResult<Resource>>('/resources', { params });
  return data;
}

export async function getResource(id: string | number) {
  const { data } = await apiClient.get<{ resource: Resource; comments: Comment[] }>(`/resources/${id}`);
  return data;
}

export async function publishResource(formData: FormData) {
  const { data } = await apiClient.post<Resource>('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function toggleResourceAction(id: number, action: 'like' | 'favorite' | 'download', attachmentId?: number) {
  const { data } = await apiClient.post<Resource>(`/resources/${id}/${action}`, { attachmentId });
  return data;
}

export async function rateResource(id: number, score: number) {
  const { data } = await apiClient.post<Resource>(`/resources/${id}/rating`, { score });
  return data;
}

export async function getDemands(params: ListParams) {
  const { data } = await apiClient.get<PagedResult<Demand>>('/demands', { params });
  return data;
}

export async function getDemand(id: string | number) {
  const { data } = await apiClient.get<{ demand: Demand; comments: Comment[] }>(`/demands/${id}`);
  return data;
}

export async function publishDemand(values: Record<string, unknown>) {
  const { data } = await apiClient.post<Demand>('/demands', values);
  return data;
}

export async function addComment(kind: 'resources' | 'demands', id: number, content: string) {
  const { data } = await apiClient.post<Comment>(`/${kind}/${id}/comments`, { content });
  return data;
}

export async function reportContent(values: { target: ReportTarget; targetId: number; type: string; reason: string }) {
  const { data } = await apiClient.post<{ ok: boolean }>('/reports', values);
  return data;
}
