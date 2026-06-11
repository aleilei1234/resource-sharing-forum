import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as endpoints from './endpoints';
import type { Comment, ListParams, User } from '../types';

export function useMe(token?: string | null) {
  return useQuery({ queryKey: ['me', token], queryFn: endpoints.getMe, enabled: Boolean(token) });
}

export function useProfileSummary() {
  return useQuery({ queryKey: ['profile-summary'], queryFn: endpoints.getProfileSummary });
}

export function usePointAccount(enabled = true) {
  return useQuery({ queryKey: ['point-account'], queryFn: endpoints.getPointAccount, enabled });
}

export function usePointFlows(enabled = true) {
  return useQuery({ queryKey: ['point-flows'], queryFn: () => endpoints.getPointFlows({ page: 1, pageSize: 10 }), enabled });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<User>) => endpoints.updateMe(values),
    onSuccess: (user) => {
      queryClient.setQueriesData({ queryKey: ['me'] }, user);
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.uploadAvatar,
    onSuccess: ({ avatar }) => {
      queryClient.setQueriesData<User | undefined>({ queryKey: ['me'] }, (current) => (current ? { ...current, avatar } : current));
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: endpoints.changePassword });
}

export function useBindEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.bindEmail,
    onSuccess: (user) => {
      queryClient.setQueriesData({ queryKey: ['me'] }, user);
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
    },
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: endpoints.getCategories });
}

export function useResourceTypes() {
  return useQuery({ queryKey: ['resource-types'], queryFn: endpoints.getResourceTypes });
}

export function useAnnouncements(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({ queryKey: ['announcements', params], queryFn: () => endpoints.getAnnouncements(params) });
}

export function useResources(params: ListParams) {
  return useQuery({ queryKey: ['resources', params], queryFn: () => endpoints.getResources(params) });
}

export function useResource(id?: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => endpoints.getResource(id as string),
    enabled: Boolean(id),
  });
}

export function usePublishResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.publishResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: ({ file, resourceId }: { file: File; resourceId: number }) => endpoints.uploadAttachment(file, resourceId),
  });
}

export function useSubmitResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => endpoints.submitResource(id),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['user-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', String(resource.id)] });
    },
  });
}

export function useResourceAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, attachmentId }: { id: number; action: 'like' | 'favorite' | 'download'; attachmentId?: number }) =>
      endpoints.toggleResourceAction(id, action, attachmentId),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
      queryClient.invalidateQueries({ queryKey: ['resource', String(resource.id)] });
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['user-likes'] });
    },
  });
}

export function useDownloadAttachment() {
  return useMutation({ mutationFn: (attachmentId: number) => endpoints.downloadAttachmentFile(attachmentId) });
}

export function useDownloadFileFromUrl() {
  return useMutation({ mutationFn: ({ downloadUrl, fileName }: { downloadUrl: string; fileName?: string }) => endpoints.downloadFileFromUrl(downloadUrl, fileName) });
}

export function useRateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, score }: { id: number; score: number }) => endpoints.rateResource(id, score),
    onSuccess: (resource) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource', String(resource.id)] });
    },
  });
}

export function useDemands(params: ListParams) {
  return useQuery({ queryKey: ['demands', params], queryFn: () => endpoints.getDemands(params) });
}

export function useDemand(id?: string) {
  return useQuery({
    queryKey: ['demand', id],
    queryFn: () => endpoints.getDemand(id as string),
    enabled: Boolean(id),
  });
}

export function usePublishDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.publishDemand,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demands'] }),
  });
}

export function useCancelDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => endpoints.cancelDemand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
    },
  });
}

export function useAcceptDemandAnswer(demandId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answerId: number) => endpoints.acceptDemandAnswer(demandId, answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand', String(demandId)] });
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      queryClient.invalidateQueries({ queryKey: ['user-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
    },
  });
}

export function useAddComment(kind: 'resources' | 'demands', id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { content: string; parentId?: number; resourceId?: number; externalUrl?: string; files?: File[] }) => endpoints.addComment(kind, id, values),
    onSuccess: (comment, values) => {
      const detailKey = [kind === 'resources' ? 'resource' : 'demand', String(id)];
      queryClient.setQueryData<{ comments: Comment[] }>(detailKey, (current) => {
        if (!current?.comments) return current;
        return { ...current, comments: insertComment(current.comments, { ...comment, parentId: comment.parentId || values.parentId }) };
      });
      if (kind === 'demands') {
        queryClient.invalidateQueries({ queryKey: ['demands'] });
        queryClient.invalidateQueries({ queryKey: ['profile-summary'] });
      }
    },
  });
}

function insertComment(comments: Comment[], comment: Comment): Comment[] {
  if (!comment.parentId) {
    return [comment, ...comments];
  }

  return comments.map((item) => {
    if (item.id === comment.parentId) {
      return { ...item, replies: [...(item.replies || []), comment] };
    }
    if (item.replies?.length) {
      return { ...item, replies: insertComment(item.replies, comment) };
    }
    return item;
  });
}

export function useDeleteComment(kind: 'resources' | 'demands', id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => endpoints.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [kind === 'resources' ? 'resource' : 'demand', String(id)] });
    },
  });
}

export function useReportContent() {
  return useMutation({ mutationFn: endpoints.reportContent });
}

export function useUserResources(enabled = true) {
  return useQuery({ queryKey: ['user-resources'], queryFn: () => endpoints.getUserResources({ page: 1, pageSize: 20 }), enabled });
}

export function useUserRequests(enabled = true) {
  return useQuery({ queryKey: ['user-requests'], queryFn: () => endpoints.getUserRequests({ page: 1, pageSize: 20 }), enabled });
}

export function useUserFavorites(enabled = true) {
  return useQuery({ queryKey: ['user-favorites'], queryFn: () => endpoints.getUserFavorites({ page: 1, pageSize: 20 }), enabled });
}

export function useUserLikes(enabled = true) {
  return useQuery({ queryKey: ['user-likes'], queryFn: () => endpoints.getUserLikes({ page: 1, pageSize: 20 }), enabled });
}

export function useUserLoginRecords(enabled = true) {
  return useQuery({ queryKey: ['user-login-records'], queryFn: () => endpoints.getUserLoginRecords({ page: 1, pageSize: 20 }), enabled });
}

export function useNotifications(enabled = true) {
  return useQuery({ queryKey: ['notifications'], queryFn: () => endpoints.getNotificationMessages({ page: 1, pageSize: 20 }), enabled });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endpoints.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
