import { apiClient, apiHostURL, apiPrefix, profileBasePath, usesV1Api } from './client';
import {
  mapAnnouncements,
  mapCategories,
  mapComment,
  mapDemand,
  mapDemandDetail,
  mapDownloadInfo,
  mapLoginLogs,
  mapNotifications,
  mapPaged,
  mapProfileSummary,
  mapResource,
  mapResourceDetail,
  mapResourceTypes,
  mapUser,
} from './adapters';
import type {
  Announcement,
  Category,
  Comment,
  Demand,
  DownloadInfo,
  ListParams,
  LoginLog,
  NotificationMessage,
  PagedResult,
  PointAccount,
  PointBenefit,
  PointFlow,
  PointRule,
  ProfileSummary,
  ReportTarget,
  Resource,
  ResourceTypeOption,
  User,
} from '../types';

type AuthPayload = {
  token?: string;
  user?: unknown;
};

type CodePayload = {
  ok?: boolean;
  email?: string;
  expiresInMinutes?: number;
  devCode?: string;
};

export type AttachmentView = {
  id: number;
  resourceId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
};

export const userCenterBasePath = usesV1Api ? '/user' : '/v1/user';
export const attachmentBasePath = usesV1Api ? '/attachments' : '/v1/attachments';

export async function login(values: { account: string; password: string }) {
  const { data } = await apiClient.post<AuthPayload>('/auth/login', { ...values, rememberMe: true });
  return {
    token: data.token || '',
    user: mapUser(data.user),
  };
}

export async function register(values: { username: string; email: string; password: string; code: string }) {
  const { data } = await apiClient.post<AuthPayload>('/auth/register', values);
  return {
    token: data.token || '',
    user: mapUser(data.user),
  };
}

export async function sendRegisterCode(values: { email: string }) {
  const { data } = await apiClient.post<CodePayload>('/auth/register/code', {
    email: values.email,
  });
  return {
    ok: data?.ok !== false,
    email: data?.email || values.email,
    expiresInMinutes: data?.expiresInMinutes || 10,
    devCode: data?.devCode,
  };
}

export async function resetPassword(values: { email: string; code: string; password: string }) {
  const payload = {
    account: values.email,
    email: values.email,
    code: values.code,
    password: values.password,
    newPassword: values.password,
  };
  const { data } = await apiClient.post<{ ok?: boolean }>('/auth/reset-password', payload);
  return { ok: data?.ok !== false };
}

export async function sendResetPasswordCode(values: { email: string }) {
  const { data } = await apiClient.post<CodePayload>('/auth/reset-password/code', {
    account: values.email,
    email: values.email,
  });
  return {
    ok: data?.ok !== false,
    email: data?.email || values.email,
    expiresInMinutes: data?.expiresInMinutes || 10,
    devCode: data?.devCode,
  };
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<unknown>(profileBasePath);
  return mapUser(data);
}

export async function updateMe(values: Partial<User>): Promise<User> {
  const { data } = await apiClient.put<unknown>(profileBasePath, values);
  return mapUser(data);
}

export async function uploadAvatar(file: File): Promise<{ avatar: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ avatar?: string; avatarUrl?: string }>('/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const avatar = data.avatarUrl || data.avatar || '';
  return { avatar: avatar ? absoluteDownloadUrl(avatar) : '' };
}

export async function changePassword(values: { oldPassword: string; newPassword: string }) {
  const payload = {
    ...values,
    currentPassword: values.oldPassword,
    password: values.newPassword,
  };
  const { data } = await apiClient.post<{ ok?: boolean; passwordUpdatedAt?: string }>(`${profileBasePath}/password`, payload);
  return {
    ok: data?.ok !== false,
    passwordUpdatedAt: data?.passwordUpdatedAt || new Date().toISOString().slice(0, 10),
  };
}

export async function bindEmail(values: { email: string }): Promise<User> {
  const { data } = await apiClient.post<unknown>(`${profileBasePath}/email`, {
    ...values,
    newEmail: values.email,
  });
  return mapUser(data);
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const { data } = await apiClient.get<unknown>(`${profileBasePath}/summary`);
  return mapProfileSummary(data);
}

export async function getPointAccount(): Promise<PointAccount> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/points`);
  return mapPointAccount(data);
}

export async function getPointFlows(params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<PointFlow>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/points/flows`, {
    params: { page: params.page || 1, size: params.pageSize || 10 },
  });
  return mapPaged(data, mapPointFlow);
}

export async function getResources(params: ListParams): Promise<PagedResult<Resource>> {
  const { data } = await apiClient.get<unknown>('/resources', { params: toBackendListParams(params) });
  return mapPaged(data, mapResource);
}

export async function getResource(id: string | number): Promise<{ resource: Resource; comments: Comment[] }> {
  const { data } = await apiClient.get<unknown>(`/resources/${id}`);
  return mapResourceDetail(data);
}

export async function publishResource(formData: FormData): Promise<Resource> {
  const { data } = await apiClient.post<unknown>('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapResource(data);
}

export async function uploadAttachment(file: File, resourceId: number): Promise<AttachmentView> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resourceId', String(resourceId));

  const { data } = await apiClient.post<unknown>(`${attachmentBasePath}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapAttachmentView(data);
}

export async function submitResource(id: number): Promise<Resource> {
  const { data } = await apiClient.post<unknown>(`/resources/${id}/submit`);
  return mapResource(data);
}

export async function toggleResourceAction(id: number, action: 'like' | 'favorite' | 'download', attachmentId?: number): Promise<Resource> {
  if (action === 'download') {
    await apiClient.post(`/resources/${id}/download`, { attachmentId });
    return (await getResource(id)).resource;
  }

  const { data } = await apiClient.post<unknown>(`/resources/${id}/${action}`);
  return mapResource(data);
}

export async function downloadAttachment(attachmentId: number): Promise<DownloadInfo> {
  const downloadPath = `${attachmentBasePath}/${attachmentId}/download`;
  const { data } = await apiClient.get<unknown>(downloadPath);
  return mapDownloadInfo(data);
}

export async function downloadAttachmentFile(attachmentId: number): Promise<{ fileName: string; blob: Blob }> {
  const info = await downloadAttachment(attachmentId);
  if (!info.downloadUrl) {
    throw new Error('后端未返回附件下载地址');
  }

  return downloadFileFromUrl(info.downloadUrl, info.fileName || `attachment-${attachmentId}`);
}

export async function downloadFileFromUrl(downloadUrl: string, fallbackFileName = 'attachment'): Promise<{ fileName: string; blob: Blob }> {
  const downloadPath = toApiClientDownloadPath(downloadUrl);
  const { data, headers, status } = await apiClient.get<Blob>(downloadPath, {
    responseType: 'blob',
    validateStatus: () => true,
  });

  if (status >= 400) {
    const message = await readBlobError(data);
    throw new Error(message ? `附件下载失败（HTTP ${status}）：${message}` : `附件下载失败（HTTP ${status}）：${downloadPath}`);
  }

  if (data.type.includes('application/json')) {
    const message = await readBlobError(data);
    throw new Error(message || '附件流接口返回了错误响应');
  }

  return {
    fileName: contentDispositionFileName(headers['content-disposition']) || fallbackFileName,
    blob: data,
  };
}

export async function rateResource(id: number, score: number): Promise<Resource> {
  if (score <= 0) {
    return (await getResource(id)).resource;
  }

  const { data } = await apiClient.post<unknown>(`/resources/${id}/rating`, { score: Math.min(5, score) });
  return mapResource(data);
}

export async function getDemands(params: ListParams): Promise<PagedResult<Demand>> {
  const { data } = await apiClient.get<unknown>('/requests', { params: toBackendListParams(params) });
  return mapPaged(data, mapDemand);
}

export async function getDemand(id: string | number): Promise<{ demand: Demand; comments: Comment[] }> {
  const { data } = await apiClient.get<unknown>(`/requests/${id}`);
  return mapDemandDetail(data);
}

export async function publishDemand(values: Record<string, unknown>): Promise<Demand> {
  const payload = {
    ...values,
    categoryId: values.category2,
    expectedFormat: values.format,
    rewardPoints: values.points,
  };
  const { data } = await apiClient.post<unknown>('/requests', payload);
  return mapDemand(data);
}

export async function cancelDemand(id: number) {
  const { data } = await apiClient.post<{ ok?: boolean }>(`/requests/${id}/cancel`);
  return { ok: data?.ok !== false };
}

export async function acceptDemandAnswer(demandId: number, answerId: number): Promise<Demand> {
  const { data } = await apiClient.post<unknown>(`/requests/${demandId}/answers/${answerId}/accept`);
  return mapDemand(data);
}

export async function addComment(
  kind: 'resources' | 'demands',
  id: number,
  values: { content: string; parentId?: number; resourceId?: number; externalUrl?: string; files?: File[] },
): Promise<Comment> {
  if (kind === 'demands' && !values.parentId) {
    if (values.files?.length) {
      const formData = new FormData();
      formData.append('content', values.content);
      if (values.resourceId) formData.append('resourceId', String(values.resourceId));
      if (values.externalUrl) formData.append('externalUrl', values.externalUrl);
      values.files.forEach((file) => formData.append('files', file));
      const { data } = await apiClient.post<unknown>(`/requests/${id}/replies`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return mapComment(data);
    }

    const { data } = await apiClient.post<unknown>(`/requests/${id}/replies`, {
      content: values.content,
      resourceId: values.resourceId,
      externalUrl: values.externalUrl,
    });
    return mapComment(data);
  }

  const { data } = await apiClient.post<unknown>('/comments', {
    targetType: kind === 'resources' ? 'RESOURCE' : 'REQUEST_POST',
    targetId: id,
    content: values.content,
    parentId: values.parentId,
  });
  return mapComment(data);
}

export async function deleteComment(id: number) {
  const { data } = await apiClient.delete<{ ok?: boolean }>(`/comments/${id}`);
  return { ok: data?.ok !== false };
}

export async function reportContent(values: {
  target: ReportTarget;
  targetId: number;
  type: string;
  title?: string;
  reason: string;
  proofSummary?: string;
  contactEmail?: string;
}) {
  const isCopyright = values.target === 'COPYRIGHT' || values.type === 'COPYRIGHT';
  const targetType = values.target === 'DEMAND' ? 'REQUEST_POST' : values.target;
  const commonPayload = {
    targetId: values.targetId,
    title: values.title,
    reason: values.reason,
    proofSummary: values.proofSummary,
    contactEmail: values.contactEmail,
  };
  const payload = isCopyright
    ? commonPayload
    : {
        ...commonPayload,
        target: targetType,
        targetType,
        type: values.type,
      };
  const { data } = await apiClient.post<{ ok?: boolean }>(isCopyright ? '/reports/copyright-complaints' : '/reports', payload);
  return { ok: data?.ok !== false };
}

export async function getNotificationMessages(params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<NotificationMessage>> {
  const { data } = await apiClient.get<unknown>('/notifications', { params: { page: params.page || 1, size: params.pageSize || 20 } });
  return mapNotifications(data);
}

export async function markNotificationRead(id: number) {
  await apiClient.post(`/notifications/${id}/read`);
  return { ok: true };
}

export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read-all');
  return { ok: true };
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<unknown>('/categories');
  return mapCategories(data);
}

export async function getResourceTypes(): Promise<ResourceTypeOption[]> {
  const { data } = await apiClient.get<unknown>('/resource-types');
  return mapResourceTypes(data);
}

export async function getAnnouncements(params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<Announcement>> {
  const { data } = await apiClient.get<unknown>('/announcements', { params: { page: params.page || 1, size: params.pageSize || 5 } });
  return mapAnnouncements(data);
}

export async function getUserResources(params: ListParams = {}): Promise<PagedResult<Resource>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/resources`, { params: toBackendListParams(params) });
  return mapPaged(data, mapResource);
}

export async function getUserRequests(params: ListParams = {}): Promise<PagedResult<Demand>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/requests`, { params: toBackendListParams(params) });
  return mapPaged(data, mapDemand);
}

export async function getUserFavorites(params: ListParams = {}): Promise<PagedResult<Resource>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/favorites`, { params: toBackendListParams(params) });
  return mapPaged(data, mapResource);
}

export async function getUserLikes(params: ListParams = {}): Promise<PagedResult<Resource>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/likes`, { params: toBackendListParams(params) });
  return mapPaged(data, mapResource);
}

export async function getUserLoginRecords(params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<LoginLog>> {
  const { data } = await apiClient.get<unknown>(`${userCenterBasePath}/login-records`, { params: { page: params.page || 1, size: params.pageSize || 20 } });
  return mapLoginLogs(data);
}

export function absoluteDownloadUrl(downloadUrl: string) {
  return new URL(downloadUrl, apiHostURL).toString();
}

function toBackendListParams(params: ListParams) {
  const categoryId = params.cate2;
  return {
    page: params.page,
    size: params.pageSize,
    keyword: params.keyword,
    categoryId,
    category1: params.cate1,
    cate1: params.cate1,
    category2: params.cate2,
    cate2: params.cate2,
    resourceType: toResourceType(params.type),
    type: params.type,
    rewardRange: params.rewardRange,
    points: params.rewardRange,
    pointsFilter: params.rewardRange,
    status: toRequestStatus(params.status),
    sort: params.sort,
  };
}

function mapAttachmentView(value: unknown): AttachmentView {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    id: Number(raw.id) || 0,
    resourceId: Number(raw.resourceId) || 0,
    fileName: String(raw.fileName || ''),
    fileType: String(raw.fileType || ''),
    fileSize: Number(raw.fileSize) || 0,
    status: String(raw.status || ''),
  };
}

function mapPointAccount(value: unknown): PointAccount {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const points = Number(raw.points) || 0;
  const frozenPoints = Number(raw.frozenPoints) || 0;
  const nextLevelMinPoints = Number(raw.nextLevelMinPoints) || 0;
  const expNeeded = Number(raw.expNeeded) || (nextLevelMinPoints > points ? nextLevelMinPoints - points : 0);
  const progressPercent = Number(raw.progressPercent ?? raw.upgradeProgress) || (nextLevelMinPoints > 0 ? Math.min(100, Math.round((points / nextLevelMinPoints) * 100)) : 100);
  return {
    points,
    frozenPoints,
    availablePoints: Number(raw.availablePoints) || Math.max(0, points - frozenPoints),
    level: String(raw.level || 'Member'),
    levelCode: String(raw.levelCode || ''),
    levelMinPoints: Number(raw.levelMinPoints) || 0,
    levelMaxPoints: raw.levelMaxPoints == null ? undefined : Number(raw.levelMaxPoints) || 0,
    nextLevel: String(raw.nextLevel || ''),
    nextLevelMinPoints,
    rewardLimit: Number(raw.rewardLimit) || 100,
    dailyDownloadLimit: Number(raw.dailyDownloadLimit) || 0,
    dailyResourcePublishLimit: Number(raw.dailyResourcePublishLimit) || 0,
    dailyRequestPublishLimit: Number(raw.dailyRequestPublishLimit) || 0,
    maxFilesPerResource: Number(raw.maxFilesPerResource) || 0,
    maxFileSizeMb: Number(raw.maxFileSizeMb) || 0,
    canApplyTop: Boolean(raw.canApplyTop),
    expNeeded,
    progressPercent,
    benefits: toArray(raw.benefits).map(mapPointBenefit),
    pointRules: toArray(raw.pointRules || raw.rules).map(mapPointRule),
  };
}

function mapPointFlow(value: unknown): PointFlow {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    id: Number(raw.id) || 0,
    flowType: String(raw.flowType || ''),
    scene: String(raw.scene || ''),
    pointsChange: Number(raw.pointsChange) || 0,
    frozenChange: Number(raw.frozenChange) || 0,
    beforePoints: Number(raw.beforePoints) || 0,
    afterPoints: Number(raw.afterPoints) || 0,
    beforeFrozenPoints: Number(raw.beforeFrozenPoints) || 0,
    afterFrozenPoints: Number(raw.afterFrozenPoints) || 0,
    relatedType: String(raw.relatedType || ''),
    relatedId: Number(raw.relatedId) || 0,
    description: String(raw.description || ''),
    createTime: String(raw.createTime || ''),
    sceneLabel: String(raw.sceneLabel || ''),
    relatedLabel: String(raw.relatedLabel || ''),
    balanceText: String(raw.balanceText || ''),
  };
}

function mapPointBenefit(value: unknown): PointBenefit {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const limit = raw.limit ?? raw.value ?? '';
  return {
    name: String(raw.name || ''),
    description: String(raw.description || ''),
    limit: typeof limit === 'number' ? limit : String(limit),
    enabled: raw.enabled !== false,
  };
}

function mapPointRule(value: unknown): PointRule {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    key: String(raw.key || ''),
    action: String(raw.action || raw.name || ''),
    points: String(raw.points || ''),
    note: String(raw.note || raw.description || ''),
  };
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toApiClientDownloadPath(downloadUrl: string) {
  if (/^https?:\/\//i.test(downloadUrl)) {
    return downloadUrl;
  }
  if (downloadUrl === apiPrefix) {
    return '/';
  }
  if (downloadUrl.startsWith(`${apiPrefix}/`)) {
    return downloadUrl.slice(apiPrefix.length);
  }
  if (!usesV1Api && downloadUrl.startsWith('/api/v1/')) {
    return downloadUrl.slice('/api'.length);
  }
  if (usesV1Api && downloadUrl.startsWith('/api/v1/')) {
    return downloadUrl.slice('/api/v1'.length) || '/';
  }
  return downloadUrl;
}

async function readBlobError(blob: Blob) {
  try {
    const raw = await blob.text();
    const parsed = JSON.parse(raw) as { message?: string; code?: number };
    return parsed.message || raw;
  } catch {
    return '';
  }
}

function contentDispositionFileName(value: unknown) {
  const header = Array.isArray(value) ? value[0] : String(value || '');
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeFileName(utf8Match[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ? decodeFileName(plainMatch[1]) : '';
}

function decodeFileName(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toRequestStatus(status?: string) {
  if (status === 'active') return 'ONGOING';
  if (status === 'solved') return 'RESOLVED';
  if (status === 'cancelled') return 'CANCELLED';
  if (status === 'closed') return 'CLOSED';
  return status;
}

function toResourceType(type?: string) {
  const map: Record<string, string> = {
    文档: 'DOCUMENT',
    软件: 'SOFTWARE',
    源码: 'SOURCE_CODE',
    素材: 'MATERIAL',
    教程: 'COURSE',
    模板: 'TEMPLATE',
    链接: 'LINK',
  };
  return type ? map[type] || type : undefined;
}
