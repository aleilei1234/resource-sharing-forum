export type AdminResource = {
  id: number;
  title: string;
  user?: string;
  status: string;
};

export type AdminRequestPost = {
  id: number;
  title: string;
  status: string;
};

export type AdminComment = {
  id: number;
  content: string;
  target: string;
  status: string;
};

export type AdminUser = {
  id: number;
  nickname: string;
  registeredAt: string;
  status: string;
};

export type AdminReport = {
  id: number;
  targetId: number;
  target: string;
  type: string;
  status: string;
  action: 'delete-comment' | 'offline-resource' | 'close-request';
};

export type AdminComplaint = {
  id: number;
  resourceId: number;
  resourceName: string;
  complainant: string;
  status: string;
};

export type AdminCategory = {
  id: number;
  name: string;
  type: string;
  parent: string;
  relationCount: number;
  status: string;
};

export type AdminLog = {
  time: string;
  adminId: string;
  ip: string;
  type: string;
  target: string;
  targetId: string;
  before: string;
  after: string;
  result: string;
};

export type MemberLevel = {
  name: string;
  min: string;
  max: string;
  downloads: string;
  files: string;
  rewardLimit: string;
  canTop: string;
};
