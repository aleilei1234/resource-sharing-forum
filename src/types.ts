export type Category = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

export type ResourceTypeOption = {
  value: string;
  label: string;
};

export type User = {
  id: number;
  username: string;
  nickname: string;
  email: string;
  emailVerified: boolean;
  bio: string;
  contact: string;
  avatar: string;
  level: string;
  points: number;
  frozenPoints: number;
  availablePoints: number;
  rewardLimit: number;
  dailyDownloadLimit?: number;
  dailyResourcePublishLimit?: number;
  dailyRequestPublishLimit?: number;
  maxFilesPerResource?: number;
  maxFileSizeMb?: number;
  canApplyTop?: boolean;
  nextLevel?: string;
  nextLevelMinPoints?: number;
  progressPercent?: number;
  benefits?: PointBenefit[];
  pointRules?: PointRule[];
  expNeeded: number;
  passwordUpdatedAt: string;
};

export type PointBenefit = {
  name: string;
  description: string;
  limit: number | string;
  enabled: boolean;
};

export type PointRule = {
  key: string;
  action: string;
  points: string;
  note: string;
};

export type PointAccount = {
  points: number;
  frozenPoints: number;
  availablePoints: number;
  level: string;
  levelCode: string;
  levelMinPoints: number;
  levelMaxPoints?: number;
  nextLevel: string;
  nextLevelMinPoints: number;
  rewardLimit: number;
  dailyDownloadLimit: number;
  dailyResourcePublishLimit: number;
  dailyRequestPublishLimit: number;
  maxFilesPerResource: number;
  maxFileSizeMb: number;
  canApplyTop: boolean;
  expNeeded: number;
  progressPercent: number;
  benefits: PointBenefit[];
  pointRules: PointRule[];
};

export type PointFlow = {
  id: number;
  flowType: string;
  scene: string;
  pointsChange: number;
  frozenChange: number;
  beforePoints: number;
  afterPoints: number;
  beforeFrozenPoints: number;
  afterFrozenPoints: number;
  relatedType: string;
  relatedId: number;
  description: string;
  createTime: string;
  sceneLabel?: string;
  relatedLabel?: string;
  balanceText?: string;
};

export type ResourceAttachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  downloads: number;
  downloadUrl?: string;
};

export type Resource = {
  id: number;
  title: string;
  description: string;
  detail: string;
  category1: string;
  category2: string;
  type: string;
  author: string;
  downloads: number;
  score: number;
  date: string;
  tags: string[];
  fileName: string;
  fileSize: string;
  attachments: ResourceAttachment[];
  liked: boolean;
  favorited: boolean;
  userRating: number;
  ratingCount: number;
  status?: string;
};

export type DemandStatus = 'active' | 'solved' | 'cancelled' | 'closed';

export type Demand = {
  id: number;
  title: string;
  description: string;
  category1: string;
  category2: string;
  points: number;
  replyCount: number;
  author: string;
  date: string;
  status: DemandStatus;
  tags: string[];
  format: string;
};

export type Comment = {
  id: number;
  parentId?: number;
  resourceId?: number;
  externalUrl?: string;
  author: string;
  content: string;
  date: string;
  mine?: boolean;
  accepted?: boolean;
  attachments?: ResourceAttachment[];
  replyToAuthor?: string;
  replies?: Comment[];
};

export type ReportTarget = 'RESOURCE' | 'DEMAND' | 'COMMENT' | 'COPYRIGHT';

export type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export type NotificationMessage = {
  id: number;
  title: string;
  content: string;
  unread: boolean;
  date: string;
};

export type LoginLog = {
  id: number;
  ip: string;
  device: string;
  location: string;
  time: string;
};

export type DownloadInfo = {
  recordId: number;
  fileName: string;
  downloadUrl: string;
};

export type ListParams = {
  keyword?: string;
  cate1?: string;
  cate2?: string;
  type?: string;
  rewardRange?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProfileSummary = {
  resources: Resource[];
  demands: Demand[];
  favorites: Resource[];
  likes: Resource[];
  messages: NotificationMessage[];
  loginLogs: LoginLog[];
};
