import {
  BellOutlined,
  DeleteOutlined,
  GiftOutlined,
  HeartOutlined,
  LikeOutlined,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useBindEmail,
  useCancelDemand,
  useChangePassword,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMe,
  useNotifications,
  usePointAccount,
  usePointFlows,
  useResourceAction,
  useUpdateMe,
  useUploadAvatar,
  useUserFavorites,
  useUserLikes,
  useUserLoginRecords,
  useUserRequests,
  useUserResources,
} from '../api/hooks';
import { ApiError } from '../components/ApiState';
import { useAuthStore } from '../store/auth';
import type { Demand, PointAccount, PointBenefit, PointFlow, PointRule, Resource } from '../types';
import { demandStatusLabel } from '../utils/format';

type TabKey = 'profile' | 'my-resource' | 'my-demand' | 'my-fav' | 'my-like' | 'member' | 'message' | 'security' | 'login-log';

const menu: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
  { key: 'profile', label: '个人资料', icon: <UserOutlined /> },
  { key: 'my-resource', label: '我发布的资源', icon: <GiftOutlined /> },
  { key: 'my-demand', label: '我的求资源', icon: <MessageOutlined /> },
  { key: 'my-fav', label: '我的收藏', icon: <HeartOutlined /> },
  { key: 'my-like', label: '我的点赞', icon: <LikeOutlined /> },
  { key: 'member', label: '会员中心', icon: <SafetyCertificateOutlined /> },
  { key: 'message', label: '消息中心', icon: <BellOutlined /> },
  { key: 'security', label: '安全中心', icon: <LockOutlined /> },
  { key: 'login-log', label: '登录记录', icon: <LoginOutlined /> },
];

const tabKeys = new Set<TabKey>(menu.map((item) => item.key));

function getTabKey(value: string | null): TabKey {
  return value && tabKeys.has(value as TabKey) ? (value as TabKey) : 'profile';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = getTabKey(searchParams.get('tab'));
  const { token, setUser, logout } = useAuthStore();
  const meQuery = useMe(token);
  const updateMe = useUpdateMe();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();
  const bindEmail = useBindEmail();
  const cancelDemand = useCancelDemand();
  const resourceAction = useResourceAction();
  const userResourcesQuery = useUserResources(active === 'my-resource');
  const userRequestsQuery = useUserRequests(active === 'my-demand');
  const userFavoritesQuery = useUserFavorites(active === 'my-fav');
  const userLikesQuery = useUserLikes(active === 'my-like');
  const pointAccountQuery = usePointAccount(active === 'member');
  const pointFlowsQuery = usePointFlows(active === 'member');
  const notificationsQuery = useNotifications(true);
  const markNotificationRead = useMarkNotificationRead();
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const loginRecordsQuery = useUserLoginRecords(active === 'login-log');
  const user = meQuery.data;
  const pointAccount = pointAccountQuery.data;
  const memberPoints = pointAccount?.points ?? user?.points ?? 0;
  const unreadCount = notificationsQuery.data?.items.filter((item) => item.unread).length || 0;

  const [profile, setProfile] = useState({ nickname: '', bio: '', avatar: '' });
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [email, setEmail] = useState({ email: '' });

  useEffect(() => {
    if (user) {
      setProfile({ nickname: user.nickname, bio: user.bio, avatar: user.avatar });
      setEmail((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const percent = useMemo(() => {
    if (!user) return 0;
    if (typeof pointAccount?.progressPercent === 'number') return pointAccount.progressPercent;
    return Math.min(100, Math.round((memberPoints / Math.max(user.expNeeded, 1)) * 100));
  }, [memberPoints, pointAccount?.progressPercent, user]);

  if (meQuery.error) {
    return <div className="container"><div className="card"><div className="card-body"><ApiError error={meQuery.error} /></div></div></div>;
  }

  if (!user) {
    return <div className="container"><div className="card"><div className="card-body">加载中...</div></div></div>;
  }

  async function saveProfile() {
    if (profile.nickname.trim().length < 2) {
      message.warning('昵称需 2-20 个字符');
      return;
    }
    try {
      const next = await updateMe.mutateAsync({ nickname: profile.nickname, bio: profile.bio });
      setUser(next);
      message.success('保存成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function uploadProfileAvatar(event: ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      message.warning('头像仅支持 jpg、png、webp、gif');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.warning('头像文件不能超过 5MB');
      return;
    }
    try {
      const { avatar } = await uploadAvatar.mutateAsync(file);
      const nextUser = { ...user, avatar };
      setProfile((prev) => ({ ...prev, avatar }));
      setUser(nextUser);
      message.success('头像上传成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '头像上传失败');
    }
  }

  async function submitPassword() {
    if (password.newPassword.length < 8) {
      message.warning('新密码至少 8 位');
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      message.warning('两次密码不一致');
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword: password.oldPassword, newPassword: password.newPassword });
      setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' });
      message.success('密码修改成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function submitEmail() {
    try {
      const next = await bindEmail.mutateAsync({ email: email.email });
      setUser(next);
      message.success('邮箱更换成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function removeDemand(item: Demand) {
    if (!window.confirm(`确认取消求资源「${item.title}」吗？`)) return;
    try {
      await cancelDemand.mutateAsync(item.id);
      message.success('已取消该求资源请求');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function cancelFavorite(item: Resource) {
    try {
      await resourceAction.mutateAsync({ id: item.id, action: 'favorite' });
      message.success('已取消收藏');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function cancelLike(item: Resource) {
    try {
      await resourceAction.mutateAsync({ id: item.id, action: 'like' });
      message.success('已取消点赞');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  function switchTab(tab: TabKey) {
    const next = new URLSearchParams(searchParams);
    if (tab === 'profile') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next);
  }

  return (
    <div className="container">
      <div className="main-wrapper">
        <aside className="left-menu">
          <div className="card">
            <div className="card-body">
              <div className="user-info">
                {user.avatar ? <img className="user-avatar" src={user.avatar} alt="头像" /> : <div className="user-avatar" />}
                <div className="user-text">
                  <h3>{user.nickname}</h3>
                  <p>{user.level} | 积分：{user.points}</p>
                  <div className="level-box">
                    <div className="level-text">
                      <span>升级进度</span>
                      <span>{user.points}/{user.expNeeded}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {menu.map((item) => (
            <div className={`menu-item ${active === item.key ? 'active' : ''}`} key={item.key} onClick={() => switchTab(item.key)}>
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.label}</span>
              {item.key === 'message' && unreadCount > 0 && <span className="menu-badge">{unreadCount}</span>}
            </div>
          ))}
          <div
            className="menu-item"
            style={{ color: '#f44336' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <span className="menu-icon"><LogoutOutlined /></span>
            <span className="menu-text">退出登录</span>
          </div>
        </aside>

        <main className="right-content">
          {active === 'profile' && (
            <div className="card">
              <div className="card-title">个人资料</div>
              <div className="card-body">
                <div className="avatar-preview">
                  {profile.avatar ? <img className="avatar-preview-img" src={profile.avatar} alt="头像" /> : <div className="avatar-preview-img" />}
                  <div>
                    <label className={`avatar-upload-btn ${uploadAvatar.isPending ? 'disabled' : ''}`}>
                      {uploadAvatar.isPending ? '上传中...' : '上传头像'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={uploadProfileAvatar} disabled={uploadAvatar.isPending} />
                    </label>
                    <div className="tip">支持 jpg/png/webp/gif，文件不超过 5MB</div>
                  </div>
                </div>
                <div className="form-item">
                  <label className="form-label">用户名</label>
                  <input className="form-input" value={user.username} readOnly />
                </div>
                <div className="form-item">
                  <label className="form-label">昵称</label>
                  <input className="form-input" value={profile.nickname} onChange={(event) => setProfile((prev) => ({ ...prev, nickname: event.target.value }))} maxLength={20} />
                </div>
                <div className="form-item">
                  <label className="form-label">简介</label>
                  <textarea className="form-textarea" value={profile.bio} onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))} maxLength={100} />
                </div>
                <button className="btn-primary" onClick={saveProfile} disabled={updateMe.isPending || uploadAvatar.isPending}>保存修改</button>
              </div>
            </div>
          )}

          {active === 'my-resource' && <ListCard title="我发布的资源" items={userResourcesQuery.data?.items || []} loading={userResourcesQuery.isLoading} error={userResourcesQuery.error} getHref={(item: Resource) => `/resources/${item.id}`} render={(item: Resource) => item.title} meta={(item: Resource) => `${item.date} | 状态：${resourceStatusLabel(item.status)} | 下载：${item.downloads}`} />}
          {active === 'my-demand' && <ListCard title="我的求资源" items={userRequestsQuery.data?.items || []} loading={userRequestsQuery.isLoading} error={userRequestsQuery.error} getHref={(item: Demand) => `/demands/${item.id}`} render={(item: Demand) => item.title} meta={(item: Demand) => `悬赏：${item.points}积分 | 状态：${demandStatusLabel(item.status)} | 回复：${item.replyCount}`} action={{ label: '取消', icon: <DeleteOutlined />, onClick: removeDemand, pending: cancelDemand.isPending }} />}
          {active === 'my-fav' && <ListCard title="我的收藏" items={userFavoritesQuery.data?.items || []} loading={userFavoritesQuery.isLoading} error={userFavoritesQuery.error} getHref={(item: Resource) => `/resources/${item.id}`} render={(item: Resource) => item.title} meta={(item: Resource) => `${item.date} | ${item.type}`} action={{ label: '取消收藏', onClick: cancelFavorite, pending: resourceAction.isPending }} />}
          {active === 'my-like' && <ListCard title="我的点赞" items={userLikesQuery.data?.items || []} loading={userLikesQuery.isLoading} error={userLikesQuery.error} getHref={(item: Resource) => `/resources/${item.id}`} render={(item: Resource) => item.title} meta={(item: Resource) => `${item.date} | ${item.author}`} action={{ label: '取消点赞', onClick: cancelLike, pending: resourceAction.isPending }} />}
          {active === 'member' && (
            <MemberCenter
              account={pointAccount || {
                points: user.points,
                frozenPoints: user.frozenPoints,
                availablePoints: user.availablePoints,
                level: user.level,
                levelCode: '',
                levelMinPoints: 0,
                nextLevel: user.nextLevel || '',
                nextLevelMinPoints: user.nextLevelMinPoints || 0,
                rewardLimit: user.rewardLimit,
                dailyDownloadLimit: user.dailyDownloadLimit || 0,
                dailyResourcePublishLimit: user.dailyResourcePublishLimit || 0,
                dailyRequestPublishLimit: user.dailyRequestPublishLimit || 0,
                maxFilesPerResource: user.maxFilesPerResource || 0,
                maxFileSizeMb: user.maxFileSizeMb || 0,
                canApplyTop: Boolean(user.canApplyTop),
                expNeeded: user.expNeeded,
                progressPercent: user.progressPercent || percent,
                benefits: user.benefits || [],
                pointRules: user.pointRules || [],
              }}
              flows={pointFlowsQuery.data?.items || []}
              percent={percent}
              loading={pointAccountQuery.isLoading || pointFlowsQuery.isLoading}
              error={pointAccountQuery.error || pointFlowsQuery.error}
            />
          )}
          {active === 'message' && <MessageCenter messages={notificationsQuery.data?.items || []} loading={notificationsQuery.isLoading} error={notificationsQuery.error} onRead={(id) => markNotificationRead.mutateAsync(id)} onReadAll={() => markAllNotificationsRead.mutateAsync()} pending={markNotificationRead.isPending || markAllNotificationsRead.isPending} />}
          {active === 'security' && (
            <>
              <div className="card">
                <div className="card-title">修改密码</div>
                <div className="card-body">
                  <div className="form-item"><label className="form-label">当前密码</label><input className="form-input" type="password" value={password.oldPassword} onChange={(event) => setPassword((prev) => ({ ...prev, oldPassword: event.target.value }))} /></div>
                  <div className="form-item"><label className="form-label">新密码</label><input className="form-input" type="password" value={password.newPassword} onChange={(event) => setPassword((prev) => ({ ...prev, newPassword: event.target.value }))} /><div className="tip">8-20位，包含字母和数字</div></div>
                  <div className="form-item"><label className="form-label">确认新密码</label><input className="form-input" type="password" value={password.confirmPassword} onChange={(event) => setPassword((prev) => ({ ...prev, confirmPassword: event.target.value }))} /></div>
                  <button className="btn-primary" onClick={submitPassword} disabled={changePassword.isPending}>修改密码</button>
                </div>
              </div>
              <div className="card">
                <div className="card-title">更换邮箱</div>
                <div className="card-body">
                  <div className="form-item"><label className="form-label">当前邮箱</label><input className="form-input" value={user.email} readOnly /></div>
                  <div className="form-item"><label className="form-label">新邮箱</label><input className="form-input" value={email.email} onChange={(event) => setEmail({ email: event.target.value })} /></div>
                  <button className="btn-primary" onClick={submitEmail} disabled={bindEmail.isPending}>确认更换</button>
                </div>
              </div>
            </>
          )}
          {active === 'login-log' && (
            <div className="card">
              <div className="card-title">最近登录记录</div>
              <div className="card-body">
                <table className="login-table">
                  <thead><tr><th>登录时间</th><th>IP地址</th><th>设备/地理位置</th></tr></thead>
                  <tbody>
                    {(loginRecordsQuery.data?.items || []).map((log) => (
                      <tr key={log.id}><td>{log.time}</td><td>{log.ip}</td><td>{log.device} {log.location}</td></tr>
                    ))}
                  </tbody>
                </table>
                {loginRecordsQuery.isLoading && <div className="tip" style={{ marginTop: 12 }}>加载中...</div>}
                {loginRecordsQuery.error ? <ApiError error={loginRecordsQuery.error} /> : null}
                {!loginRecordsQuery.isLoading && !loginRecordsQuery.error && !(loginRecordsQuery.data?.items || []).length && <div className="tip" style={{ marginTop: 12 }}>暂无登录记录</div>}
                <div className="tip" style={{ marginTop: 12 }}>如发现异常登录，请及时修改密码</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function resourceStatusLabel(status?: string) {
  const normalized = (status || '').toUpperCase();
  const labels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    REVIEWING_RISK: '风险复核中',
    PUBLISHED: '已发布',
    REJECTED: '审核未通过',
    OFFLINE: '已下架',
    COPYRIGHT_DOWN: '版权下架',
    DELETED: '已删除',
  };
  return labels[normalized] || status || '未知';
}

type ListCardAction<T> = {
  label: string;
  icon?: ReactNode;
  pending?: boolean;
  onClick: (item: T) => void | Promise<void>;
};

function ListCard<T extends { id: number }>({
  title,
  items,
  loading,
  error,
  getHref,
  render,
  meta,
  action,
}: {
  title: string;
  items: T[];
  loading?: boolean;
  error?: unknown;
  getHref: (item: T) => string;
  render: (item: T) => ReactNode;
  meta: (item: T) => ReactNode;
  action?: ListCardAction<T>;
}) {
  const navigate = useNavigate();

  function openItem(item: T) {
    navigate(getHref(item));
  }

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-body">
        {loading && <div className="tip" style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
        {error ? <ApiError error={error} /> : null}
        {items.map((item) => (
          <div
            className="list-item clickable"
            key={item.id}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('button')) return;
              openItem(item);
            }}
          >
            <div className="list-main">
              <div className="item-title">{render(item)}</div>
              <div className="item-meta">{meta(item)}</div>
            </div>
            {action && (
              <button
                className="item-btn btn-delete list-action"
                disabled={action.pending}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  void action.onClick(item);
                }}
              >
                {action.icon}
                {action.label}
              </button>
            )}
          </div>
        ))}
        {!loading && !error && !items.length && <div className="tip" style={{ textAlign: 'center', padding: 20 }}>暂无数据</div>}
      </div>
    </div>
  );
}

function MemberCenter({
  account,
  flows,
  percent,
  loading,
  error,
}: {
  account: PointAccount;
  flows: PointFlow[];
  percent: number;
  loading?: boolean;
  error?: unknown;
}) {
  const benefits = account.benefits.length ? account.benefits : fallbackPointBenefits(account);
  const pointRules = account.pointRules.length ? account.pointRules : fallbackPointRules();
  const nextLevel = account.nextLevel || nextLevelName(account.points);
  const nextLevelTarget = account.nextLevelMinPoints || (account.expNeeded > account.points ? account.expNeeded : account.points + account.expNeeded);
  const remainingPoints = account.expNeeded || Math.max(0, nextLevelTarget - account.points);

  return (
    <div className="card">
      <div className="card-title">会员中心</div>
      <div className="card-body">
        <div className="member-current-card">
          <div className="member-hd"><div className="member-level-name">{account.level}</div><div className="member-points">当前积分：{account.points} 分</div></div>
          <div className="member-progress-section">
            <div className="progress-text"><span>{nextLevel ? `距离升级：${nextLevel}` : '已达最高等级'}</span><span>{account.points} / {nextLevelTarget || account.points}</span></div>
            <div className="progress-bar-bg"><div className="progress-bar-active" style={{ width: `${percent}%` }} /></div>
            <div className="progress-tip">{nextLevel ? `距离升级还差 ${remainingPoints} 积分` : '当前已经是最高会员等级'}</div>
          </div>
          <div className="member-stats">
            <div><span>可用积分</span><strong>{account.availablePoints}</strong></div>
            <div><span>冻结积分</span><strong>{account.frozenPoints}</strong></div>
            <div><span>悬赏上限</span><strong>{account.rewardLimit}</strong></div>
          </div>
        </div>
        {loading && <div className="tip" style={{ marginBottom: 16 }}>积分数据加载中...</div>}
        {error ? <ApiError error={error} /> : null}
        <div className="member-section">
          <div className="member-section-title">我的当前权益</div>
          <div className="member-benefits">
            {benefits.map((benefit) => <div key={benefit.name}>{formatBenefit(benefit)}</div>)}
          </div>
        </div>
        <div className="member-section">
          <div className="member-section-title">积分明细</div>
          <div className="point-flow-table">
            <div className="point-flow-head"><div>时间</div><div>类型</div><div>场景</div><div>积分变化</div><div>冻结变化</div><div>余额</div></div>
            {flows.map((flow) => (
              <div className="point-flow-row" key={flow.id}>
                <div>{formatPointTime(flow.createTime)}</div>
                <div>{flowTypeLabel(flow.flowType)}</div>
                <div>{flow.sceneLabel || sceneLabel(flow.scene)}</div>
                <div className={flow.pointsChange >= 0 ? 'point-positive' : 'point-negative'}>{signedNumber(flow.pointsChange)}</div>
                <div className={flow.frozenChange >= 0 ? 'point-positive' : 'point-negative'}>{signedNumber(flow.frozenChange)}</div>
                <div>{flow.afterPoints}</div>
                {(flow.description || flow.relatedLabel || flow.balanceText) && <div className="point-flow-desc">{[flow.description, flow.relatedLabel, flow.balanceText].filter(Boolean).join(' · ')}</div>}
              </div>
            ))}
            {!flows.length && !loading && <div className="tip" style={{ padding: 12 }}>暂无积分流水</div>}
          </div>
        </div>
        <div className="member-section"><div className="member-section-title">会员等级规则</div><div className="member-level-table"><div className="member-level-item"><span>普通会员</span><span>0 ~ 99 积分</span></div><div className="member-level-item"><span>活跃会员</span><span>100 ~ 499 积分</span></div><div className="member-level-item"><span>优质会员</span><span>500 ~ 1999 积分</span></div><div className="member-level-item"><span>资深会员</span><span>≥2000 积分</span></div></div></div>
        <div className="member-section"><div className="member-section-title">全等级权益对照表</div><div className="member-benefit-table"><div className="benefit-head"><div>权益项</div><div>普通会员</div><div>活跃会员</div><div>优质会员</div><div>资深会员</div></div><div className="benefit-row"><div>每日下载次数</div><div>10</div><div>20</div><div>50</div><div>100</div></div><div className="benefit-row"><div>每日发布资源</div><div>5</div><div>5</div><div>5</div><div>5</div></div><div className="benefit-row"><div>每日发布求资源</div><div>5</div><div>5</div><div>5</div><div>5</div></div><div className="benefit-row"><div>单资源最大附件</div><div>5</div><div>8</div><div>10</div><div>15</div></div><div className="benefit-row"><div>单文件最大大小</div><div>100MB</div><div>150MB</div><div>200MB</div><div>500MB</div></div><div className="benefit-row"><div>资源置顶资格</div><div>无</div><div>无</div><div>有</div><div>有</div></div><div className="benefit-row"><div>悬赏积分上限</div><div>100</div><div>500</div><div>2000</div><div>10000</div></div></div></div>
        <div className="member-rule-group"><div className="member-section-title">积分规则</div><div className="member-rule">{pointRules.map((rule) => <div key={rule.key || rule.action}>• {rule.action} {rule.points}<span className="member-rule-note">{rule.note}</span></div>)}</div></div>
      </div>
    </div>
  );
}

function fallbackPointBenefits(account: PointAccount): PointBenefit[] {
  return [
    { name: '每日下载次数', description: '', limit: account.dailyDownloadLimit || 10, enabled: true },
    { name: '每日发布资源', description: '', limit: account.dailyResourcePublishLimit || 5, enabled: true },
    { name: '每日发布求资源', description: '', limit: account.dailyRequestPublishLimit || 5, enabled: true },
    { name: '单资源附件数', description: '', limit: account.maxFilesPerResource || 5, enabled: true },
    { name: '单附件大小', description: '', limit: account.maxFileSizeMb || 100, enabled: true },
    { name: '单帖悬赏上限', description: '', limit: account.rewardLimit, enabled: true },
    { name: '申请置顶', description: '', limit: account.canApplyTop ? '允许' : '不允许', enabled: account.canApplyTop },
  ];
}

function fallbackPointRules(): PointRule[] {
  return [
    { key: 'point.daily_login', action: '每日登录', points: '+10', note: '同一会员每日首次登录奖励一次' },
    { key: 'point.resource_favorited', action: '资源被收藏', points: '+5', note: '首次被他人收藏时奖励发布者' },
    { key: 'point.resource_liked', action: '资源被点赞', points: '+3', note: '首次被他人点赞时奖励发布者' },
    { key: 'point.resource_approved', action: '资源审核通过', points: '+10', note: '同一资源只奖励一次' },
    { key: 'point.resource_downloaded', action: '资源被下载', points: '+5', note: '其他用户首次下载时奖励发布者，下载者不扣分' },
    { key: 'point.request_accepted', action: '回答被采纳', points: '+10', note: '回答者除悬赏外获得平台额外奖励' },
    { key: 'point.violation_penalty', action: '违规成立', points: '-10', note: '违规处理后扣减积分' },
  ];
}

function formatBenefit(benefit: PointBenefit) {
  if (benefit.name.includes('置顶') || benefit.name.includes('申请')) {
    return `${benefit.name}：${benefit.enabled ? '有' : '无'}`;
  }
  const limit = String(benefit.limit || '-');
  if (benefit.name.includes('大小') && /^\d+$/.test(limit)) return `${benefit.name}：${limit}MB`;
  return `${benefit.name}：${limit}`;
}

function nextLevelName(points: number) {
  if (points < 100) return '活跃会员';
  if (points < 500) return '优质会员';
  if (points < 2000) return '资深会员';
  return '已达最高等级';
}

function flowTypeLabel(type: string) {
  const labels: Record<string, string> = {
    EARN: '获得',
    FREEZE: '冻结',
    UNFREEZE: '解冻',
    TRANSFER_IN: '转入',
    TRANSFER_OUT: '转出',
    DEDUCT: '扣减',
    REFUND: '退回',
    ADJUST: '调整',
  };
  return labels[type] || type || '-';
}

function sceneLabel(scene: string) {
  const labels: Record<string, string> = {
    REGISTER: '注册',
    REQUEST_REWARD: '求资源悬赏',
    REQUEST_SETTLE: '采纳结算',
    RESOURCE_APPROVED: '资源审核',
    RESOURCE_DOWNLOADED: '资源下载',
    MANUAL: '人工调整',
  };
  return labels[scene] || scene || '-';
}

function signedNumber(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatPointTime(value: string) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
}

function MessageCenter({
  messages,
  loading,
  error,
  pending,
  onRead,
  onReadAll,
}: {
  messages: Array<{ id: number; title: string; content: string; unread: boolean; date: string }>;
  loading?: boolean;
  error?: unknown;
  pending?: boolean;
  onRead: (id: number) => Promise<unknown>;
  onReadAll: () => Promise<unknown>;
}) {
  const [localMessages, setLocalMessages] = useState(messages);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  async function markAllRead() {
    try {
      await onReadAll();
      setLocalMessages((prev) => prev.map((item) => ({ ...item, unread: false })));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function markRead(id: number) {
    try {
      await onRead(id);
      setLocalMessages((prev) => prev.map((messageItem) => (messageItem.id === id ? { ...messageItem, unread: false } : messageItem)));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  return (
    <div className="card">
      <div className="card-title">消息中心</div>
      <div className="card-body">
        <div className="msg-all-read"><button onClick={markAllRead} disabled={pending || Boolean(error)}>全部标为已读</button></div>
        {loading && <div className="tip" style={{ textAlign: 'center', padding: 20 }}>加载中...</div>}
        {error ? <ApiError error={error} /> : null}
        {localMessages.map((item) => (
          <div className={`msg-item ${item.unread ? 'msg-unread' : ''}`} key={item.id} onClick={() => markRead(item.id)}>
            <div className="msg-title">{item.title}</div>
            <div className="msg-content">{item.content}</div>
            <div className="msg-time">{item.date}</div>
          </div>
        ))}
        {!loading && !error && !localMessages.length && <div className="tip" style={{ textAlign: 'center', padding: 20 }}>暂无消息</div>}
      </div>
    </div>
  );
}
