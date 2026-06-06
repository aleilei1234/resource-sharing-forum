import type {
  AdminCategory,
  AdminComment,
  AdminComplaint,
  AdminLog,
  AdminReport,
  AdminRequestPost,
  AdminResource,
  AdminUser,
  MemberLevel,
} from '../types';

export const pendingResources: AdminResource[] = [
  { id: 1001, title: '2026考研政治历年真题完整版', user: '考研资料君', status: '待审核' },
  { id: 1002, title: 'Vue3 后台管理系统项目源码', user: '前端新手', status: '待审核' },
];

export const managedResources: AdminResource[] = [
  { id: 2001, title: 'Python 数据分析实战项目源码', status: '已发布' },
  { id: 2002, title: 'UI 设计规范文档（B端产品）', status: '已下架' },
];

export const requestPosts: AdminRequestPost[] = [
  { id: 3001, title: '求 Vue3 后台管理系统完整项目源码', status: '进行中' },
  { id: 3002, title: '违规资源求购帖', status: '已关闭' },
  { id: 3003, title: '求 Java 微服务项目实战教程', status: '进行中' },
];

export const comments: AdminComment[] = [
  { id: 4001, content: '这份资料非常完整，适合期末复习。', target: '2026考研政治历年真题完整版', status: '正常' },
  { id: 4002, content: '留下网盘广告链接，疑似违规。', target: 'Python 数据分析实战项目源码', status: '已删除' },
  { id: 4003, content: '请问有没有配套视频？', target: 'Vue3 后台管理系统项目源码', status: '正常' },
];

export const users: AdminUser[] = [
  { id: 1, nickname: '考研资料君', registeredAt: '2026-05-20', status: '正常' },
  { id: 2, nickname: '违规搬运号', registeredAt: '2026-05-21', status: '已禁用' },
  { id: 3, nickname: '合规用户', registeredAt: '2026-05-22', status: '正常' },
];

export const reports: AdminReport[] = [
  { id: 7001, targetId: 4002, target: '用户评论', type: '广告引流', status: '待处理', action: 'delete-comment' },
  { id: 7002, targetId: 2002, target: '违规资源', type: '侵权风险', status: '待处理', action: 'offline-resource' },
  { id: 7003, targetId: 3002, target: '求资源帖子', type: '不当求购', status: '待处理', action: 'close-request' },
];

export const complaints: AdminComplaint[] = [
  { id: 8001, resourceId: 2002, resourceName: 'UI 设计规范文档（B端产品）', complainant: '版权方A', status: '待审核' },
];

export const categories: AdminCategory[] = [
  { id: 1, name: '学习资料', type: '一级分类', parent: '无', relationCount: 128, status: '启用' },
  { id: 2, name: '设计素材', type: '一级分类', parent: '无', relationCount: 64, status: '启用' },
  { id: 11, name: '考研资料', type: '二级分类', parent: '学习资料', relationCount: 46, status: '启用' },
  { id: 21, name: 'UI设计', type: '二级分类', parent: '设计素材', relationCount: 18, status: '启用' },
  { id: 101, name: 'Vue3', type: '标签', parent: '无', relationCount: 22, status: '启用' },
  { id: 102, name: '失效标签', type: '标签', parent: '无', relationCount: 0, status: '禁用' },
];

export const memberLevels: MemberLevel[] = [
  { name: '普通会员', min: '0', max: '99', downloads: '10', files: '5', rewardLimit: '100', canTop: '无' },
  { name: '活跃会员', min: '100', max: '499', downloads: '20', files: '8', rewardLimit: '500', canTop: '无' },
  { name: '优质会员', min: '500', max: '1999', downloads: '50', files: '10', rewardLimit: '2000', canTop: '有' },
  { name: '资深会员', min: '2000', max: '无上限', downloads: '100', files: '15', rewardLimit: '10000', canTop: '有' },
];

export const logs: AdminLog[] = [
  {
    time: '2026-06-06 09:12:24',
    adminId: 'admin',
    ip: '127.0.0.1',
    type: '账号登录',
    target: '管理员账号',
    targetId: 'admin',
    before: '未登录',
    after: '已登录',
    result: '正常登录后台',
  },
  {
    time: '2026-06-06 09:30:10',
    adminId: 'admin',
    ip: '127.0.0.1',
    type: '资源审核',
    target: '共享资源',
    targetId: '1001',
    before: '待审核',
    after: '已发布',
    result: '审核通过公开',
  },
  {
    time: '2026-06-06 10:02:44',
    adminId: 'admin',
    ip: '127.0.0.1',
    type: '举报处理',
    target: '用户举报单',
    targetId: '7002',
    before: '待处理',
    after: '已处理',
    result: '判定侵权处置资源',
  },
  {
    time: '2026-06-06 10:18:31',
    adminId: 'admin',
    ip: '127.0.0.1',
    type: '分类新增',
    target: '二级分类',
    targetId: '21',
    before: '无分类数据',
    after: '插画设计',
    result: '新增插画设计分类',
  },
];
