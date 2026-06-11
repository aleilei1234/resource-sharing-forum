import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import {
  attachmentBasePath,
  downloadAttachment,
  getDemands,
  getPointAccount,
  getPointFlows,
  getResources,
  getUserFavorites,
  getUserLikes,
  getUserLoginRecords,
  getUserRequests,
  getUserResources,
  login,
  reportContent,
  sendRegisterCode,
  sendResetPasswordCode,
  submitResource,
  uploadAttachment,
  userCenterBasePath,
} from './endpoints';

describe('user center endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the versioned backend user routes when the app is configured with /api', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], total: 0, page: 1, size: 20 },
    });

    await getUserResources({ page: 1, pageSize: 20 });
    await getUserRequests({ page: 1, pageSize: 20 });
    await getUserFavorites({ page: 1, pageSize: 20 });
    await getUserLikes({ page: 1, pageSize: 20 });
    await getUserLoginRecords({ page: 1, pageSize: 20 });

    expect(userCenterBasePath).toBe('/v1/user');
    expect(get).toHaveBeenNthCalledWith(1, '/v1/user/resources', expect.any(Object));
    expect(get).toHaveBeenNthCalledWith(2, '/v1/user/requests', expect.any(Object));
    expect(get).toHaveBeenNthCalledWith(3, '/v1/user/favorites', expect.any(Object));
    expect(get).toHaveBeenNthCalledWith(4, '/v1/user/likes', expect.any(Object));
    expect(get).toHaveBeenNthCalledWith(5, '/v1/user/login-records', expect.any(Object));
  });

  it('maps the latest backend point account fields for the member center', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        points: 1260,
        frozenPoints: 50,
        availablePoints: 1210,
        level: '优质会员',
        levelCode: 'QUALITY',
        nextLevel: '资深会员',
        nextLevelMinPoints: 2000,
        rewardLimit: 2000,
        dailyDownloadLimit: 50,
        dailyResourcePublishLimit: 5,
        dailyRequestPublishLimit: 5,
        maxFilesPerResource: 10,
        maxFileSizeMb: 200,
        canApplyTop: true,
        progressPercent: 73,
        benefits: [{ name: '每日下载次数', description: '每天可下载次数', limit: 50, enabled: true }],
        pointRules: [{ key: 'point.daily_login', action: '每日登录', points: '+10', note: '每天一次' }],
      },
    });

    const result = await getPointAccount();

    expect(get).toHaveBeenCalledWith('/v1/user/points');
    expect(result.availablePoints).toBe(1210);
    expect(result.nextLevel).toBe('资深会员');
    expect(result.maxFileSizeMb).toBe(200);
    expect(result.benefits[0]?.name).toBe('每日下载次数');
    expect(result.pointRules[0]?.key).toBe('point.daily_login');
  });

  it('maps point flow display labels returned by the backend', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        items: [{
          id: 1,
          flowType: 'EARN',
          scene: 'RESOURCE_DOWNLOADED',
          pointsChange: 5,
          frozenChange: 0,
          beforePoints: 1255,
          afterPoints: 1260,
          beforeFrozenPoints: 0,
          afterFrozenPoints: 0,
          relatedType: 'RESOURCE',
          relatedId: 9,
          description: 'Resource downloaded reward',
          createTime: '2026-06-11T10:00:00',
          sceneLabel: '资源被下载',
          relatedLabel: '资源 #9',
          balanceText: '当前 1260 分，冻结 0 分',
        }],
        total: 1,
        page: 1,
        size: 10,
      },
    });

    const result = await getPointFlows({ page: 1, pageSize: 10 });

    expect(get).toHaveBeenCalledWith('/v1/user/points/flows', { params: { page: 1, size: 10 } });
    expect(result.items[0]?.sceneLabel).toBe('资源被下载');
    expect(result.items[0]?.relatedLabel).toBe('资源 #9');
    expect(result.items[0]?.balanceText).toBe('当前 1260 分，冻结 0 分');
  });
});

describe('auth login endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits email logins through the account field and maps the returned user', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        token: 'token-for-email-user',
        user: {
          id: 9,
          username: 'email_user',
          nickname: '邮箱用户',
          email: 'email-user@qq.com',
        },
      },
    });

    const result = await login({ account: 'email-user@qq.com', password: 'password123' });

    expect(post).toHaveBeenCalledWith('/auth/login', {
      account: 'email-user@qq.com',
      password: 'password123',
      rememberMe: true,
    });
    expect(result.token).toBe('token-for-email-user');
    expect(result.user.id).toBe(9);
    expect(result.user.email).toBe('email-user@qq.com');
    expect(result.user.nickname).toBe('邮箱用户');
  });
});

describe('auth verification code endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests a register verification code and preserves the backend expiry', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ok: true, email: 'new-user@qq.com', expiresInMinutes: 10 },
    });

    const result = await sendRegisterCode({ email: 'new-user@qq.com' });

    expect(result).toEqual({ ok: true, email: 'new-user@qq.com', expiresInMinutes: 10, devCode: undefined });
    expect(post).toHaveBeenCalledWith('/auth/register/code', { email: 'new-user@qq.com' });
  });

  it('requests a reset-password verification code with both account and email fields', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ok: true, email: 'old-user@qq.com', expiresInMinutes: 10 },
    });

    const result = await sendResetPasswordCode({ email: 'old-user@qq.com' });

    expect(result).toEqual({ ok: true, email: 'old-user@qq.com', expiresInMinutes: 10, devCode: undefined });
    expect(post).toHaveBeenCalledWith('/auth/reset-password/code', {
      account: 'old-user@qq.com',
      email: 'old-user@qq.com',
    });
  });
});

describe('attachment endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses versioned attachment upload when the app is configured with /api', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { id: 7, resourceId: 3, fileName: 'notes.pdf', fileType: 'pdf', fileSize: 1024, status: 'NORMAL' },
    });

    const result = await uploadAttachment(new File(['hello'], 'notes.pdf', { type: 'application/pdf' }), 3);

    expect(attachmentBasePath).toBe('/v1/attachments');
    expect(result).toEqual({ id: 7, resourceId: 3, fileName: 'notes.pdf', fileType: 'pdf', fileSize: 1024, status: 'NORMAL' });
    expect(post).toHaveBeenCalledWith('/v1/attachments/upload', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const formData = post.mock.calls[0]?.[1] as FormData;
    expect(formData.get('resourceId')).toBe('3');
    expect(formData.get('file')).toBeInstanceOf(File);
  });

  it('submits a draft resource for review after attachments are uploaded', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { id: 3, title: 'Useful Java package', attachments: [], tags: [], status: 'PENDING_REVIEW' },
    });

    await submitResource(3);

    expect(post).toHaveBeenCalledWith('/resources/3/submit');
  });

  it('requests download metadata from the versioned attachment endpoint', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { recordId: 9, fileName: 'notes.pdf', downloadUrl: '/api/v1/attachments/7/stream' },
    });

    const result = await downloadAttachment(7);

    expect(result).toEqual({ recordId: 9, fileName: 'notes.pdf', downloadUrl: '/api/v1/attachments/7/stream' });
    expect(get).toHaveBeenCalledWith('/v1/attachments/7/download');
  });
});

describe('report endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends title and proof summary for standard reports', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ok: true },
    });

    await reportContent({
      target: 'RESOURCE',
      targetId: 1,
      type: 'RESOURCE',
      title: '资源举报：测试资源',
      reason: '这是一次举报原因',
      proofSummary: '这是证据摘要',
    });

    expect(post).toHaveBeenCalledWith('/reports', {
      target: 'RESOURCE',
      targetType: 'RESOURCE',
      targetId: 1,
      type: 'RESOURCE',
      title: '资源举报：测试资源',
      reason: '这是一次举报原因',
      proofSummary: '这是证据摘要',
      contactEmail: undefined,
    });
  });

  it('sends copyright complaints with proofSummary instead of merging proof into reason', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: { ok: true },
    });

    await reportContent({
      target: 'COPYRIGHT',
      targetId: 1,
      type: 'COPYRIGHT',
      title: '版权投诉：测试资源',
      reason: '这是版权投诉原因',
      proofSummary: '这是权属证明摘要',
    });

    expect(post).toHaveBeenCalledWith('/reports/copyright-complaints', {
      targetId: 1,
      title: '版权投诉：测试资源',
      reason: '这是版权投诉原因',
      proofSummary: '这是权属证明摘要',
      contactEmail: undefined,
    });
  });
});

describe('listing endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a first-level category without treating it as a leaf categoryId', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], total: 0, page: 1, size: 10 },
    });

    await getResources({ page: 1, pageSize: 10, cate1: '1' });

    expect(get).toHaveBeenCalledWith('/resources', {
      params: expect.objectContaining({
        category1: '1',
        cate1: '1',
        categoryId: undefined,
      }),
    });
  });

  it('sends the second-level category as categoryId for backend leaf filtering', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], total: 0, page: 1, size: 10 },
    });

    await getResources({ page: 1, pageSize: 10, cate1: '1', cate2: '11' });

    expect(get).toHaveBeenCalledWith('/resources', {
      params: expect.objectContaining({
        category1: '1',
        category2: '11',
        categoryId: '11',
      }),
    });
  });

  it('sends demand reward filtering through rewardRange', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], total: 0, page: 1, size: 5 },
    });

    await getDemands({ page: 1, pageSize: 5, rewardRange: '0-100' });

    expect(get).toHaveBeenCalledWith('/requests', {
      params: expect.objectContaining({
        rewardRange: '0-100',
        points: '0-100',
        pointsFilter: '0-100',
      }),
    });
  });
});
