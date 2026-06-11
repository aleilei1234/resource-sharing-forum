import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAcceptDemandAnswer, useCategories, useDemand } from '../api/hooks';
import { ApiError } from '../components/ApiState';
import CommentPanel from '../components/CommentPanel';
import ReportModal from '../components/ReportModal';
import { useAuthStore } from '../store/auth';
import { canReplyToDemand, demandStatusLabel, formatCategory } from '../utils/format';

export default function DemandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const demandQuery = useDemand(id);
  const categoriesQuery = useCategories();
  const acceptAnswer = useAcceptDemandAnswer(Number(id || 0));
  const currentUser = useAuthStore((state) => state.user);
  const [reportOpen, setReportOpen] = useState(false);

  if (demandQuery.isLoading) {
    return <div className="container"><div className="card"><div className="card-body">加载中...</div></div></div>;
  }

  if (demandQuery.error) {
    return <div className="container"><div className="card"><div className="card-body"><ApiError error={demandQuery.error} /></div></div></div>;
  }

  if (!demandQuery.data) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body">
            求资源不存在，<Link to="/demands">返回求资源</Link>
          </div>
        </div>
      </div>
    );
  }

  const { demand, comments } = demandQuery.data;
  const categories = categoriesQuery.data || [];
  const canReply = canReplyToDemand(demand.status);
  const currentUserName = currentUser?.nickname || currentUser?.username || '';
  const isDemandOwner = Boolean(currentUserName && demand.author === currentUserName);
  const answerDisabledMessage = !canReply
    ? `该求资源当前状态为“${demandStatusLabel(demand.status)}”，不能继续提交回答。`
    : isDemandOwner
      ? '这是你发布的求资源，不能回答自己的帖子；可以在回答列表中采纳他人的回答。'
      : undefined;

  return (
    <div className="container detail-container">
      <div className="back-btn-wrapper">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i>←</i> 返回
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="resource-title resource-detail-title">
            {demand.title}
            <span className="copyright-tag" onClick={() => setReportOpen(true)}>
              版权投诉
            </span>
          </div>

          <div className="detail-meta">
            <span>分类：{formatCategory(demand.category1, demand.category2, categories)}</span>
            <span>类型：求资源</span>
            <span>发布者：{demand.author}</span>
            <span>发布时间：{demand.date}</span>
            <span>悬赏积分：{demand.points}</span>
            <span>状态：{demandStatusLabel(demand.status)}</span>
          </div>

          <div className="resource-tags">
            {demand.tags.map((tag) => (
              <span className="resource-tag round" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="action-group">
            <button className="action-item" style={{ color: '#f44336' }} onClick={() => setReportOpen(true)}>
              <span>🚩</span>
              <span>举报</span>
            </button>
          </div>

          <div className="section-title">需求说明</div>
          <div className="desc">{demand.description}</div>

          <div className="section-title">期望格式</div>
          <div className="desc">{demand.format}</div>
        </div>
      </div>

      <CommentPanel
        kind="demands"
        id={demand.id}
        comments={comments}
        title="我来回答"
        ownerName={demand.author}
        disabledMessage={answerDisabledMessage}
        canAcceptAnswer={isDemandOwner && canReply}
        acceptingAnswerId={acceptAnswer.isPending ? acceptAnswer.variables ?? null : null}
        onAcceptAnswer={(comment) => acceptAnswer.mutateAsync(comment.id)}
      />
      <ReportModal open={reportOpen} target="DEMAND" targetId={demand.id} subjectTitle={demand.title} onClose={() => setReportOpen(false)} />
    </div>
  );
}
