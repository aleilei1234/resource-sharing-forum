import { message } from 'antd';
import { type ChangeEvent, useState } from 'react';
import { useAddComment, useDeleteComment, useDownloadAttachment, useDownloadFileFromUrl } from '../api/hooks';
import type { Comment, ResourceAttachment } from '../types';
import ReportModal from './ReportModal';

type Props = {
  kind: 'resources' | 'demands';
  id: number;
  comments: Comment[];
  title?: string;
  ownerName?: string;
  disabledMessage?: string;
  canAcceptAnswer?: boolean;
  acceptingAnswerId?: number | null;
  onAcceptAnswer?: (comment: Comment) => Promise<unknown> | unknown;
};

type ReportState = {
  id: number;
  title: string;
};

export default function CommentPanel({ kind, id, comments, title, ownerName, disabledMessage, canAcceptAnswer, acceptingAnswerId, onAcceptAnswer }: Props) {
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportState | null>(null);
  const addComment = useAddComment(kind, id);
  const deleteComment = useDeleteComment(kind, id);
  const downloadAttachment = useDownloadAttachment();
  const downloadFileFromUrl = useDownloadFileFromUrl();
  const isResource = kind === 'resources';

  async function submit() {
    setFeedback(null);
    if (disabledMessage) {
      setFeedback({ type: 'error', text: disabledMessage });
      message.warning(disabledMessage);
      return;
    }
    const trimmedContent = content.trim();
    const trimmedUrl = externalUrl.trim();
    if (isResource && !trimmedContent) {
      setFeedback({ type: 'error', text: '请输入评论内容。' });
      message.warning('请输入评论内容');
      return;
    }
    if (!isResource && !trimmedContent && !trimmedUrl && !answerFiles.length) {
      setFeedback({ type: 'error', text: '请输入回答内容、资源链接或选择附件。' });
      message.warning('请输入回答内容、资源链接或选择附件');
      return;
    }
    try {
      await addComment.mutateAsync({
        content: trimmedContent,
        externalUrl: isResource ? undefined : trimmedUrl || undefined,
        files: isResource ? undefined : answerFiles,
      });
      setContent('');
      setExternalUrl('');
      setAnswerFiles([]);
      setFeedback({ type: 'success', text: isResource ? '评论已发布。' : '回答已发布。' });
      message.success(isResource ? '评论已发布' : '回答已发布');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '接口调用失败';
      setFeedback({ type: 'error', text: errorMessage });
      message.error(errorMessage);
    }
  }

  async function acceptAnswer(comment: Comment) {
    if (!onAcceptAnswer) return;
    try {
      await onAcceptAnswer(comment);
      message.success('已采纳回答');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function downloadAnswerAttachment(attachment: ResourceAttachment) {
    try {
      const file = attachment.downloadUrl
        ? await downloadFileFromUrl.mutateAsync({ downloadUrl: attachment.downloadUrl, fileName: attachment.name })
        : await downloadAttachment.mutateAsync(attachment.id);
      saveBlob(file.blob, file.fileName || attachment.name);
      message.success(`正在下载：${file.fileName || attachment.name}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '附件下载失败');
    }
  }

  async function submitReply(parent: Comment) {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    try {
      await addComment.mutateAsync({ content: replyContent.trim(), parentId: parent.id });
      setReplyingTo(null);
      setReplyContent('');
      message.success('回复已发布');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  async function removeComment(comment: Comment) {
    try {
      await deleteComment.mutateAsync(comment.id);
      message.success('评论已删除');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '接口调用失败');
    }
  }

  function isOwner(author: string) {
    return Boolean(ownerName && author === ownerName);
  }

  function reportComment(comment: Comment) {
    setReportTarget({ id: comment.id, title: comment.content });
  }

  function onAnswerFiles(event: ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    setAnswerFiles(Array.from(event.target.files || []).slice(0, 1));
    event.target.value = '';
  }

  function removeAnswerFile(file: File) {
    setAnswerFiles((current) => current.filter((item) => item !== file));
  }

  return (
    <div className="card">
      <div className="card-title">{title || (isResource ? '评论与回复' : '回答列表')}</div>
      <div className="card-body">
        {disabledMessage ? (
          <div className="form-feedback error">{disabledMessage}</div>
        ) : (
          <>
            <textarea
              className="comment-input"
              placeholder={isResource ? '请输入评论内容' : '请输入你的回答，可以分享资源、链接或说明'}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            {!isResource && (
              <div className="answer-extra">
                <input
                  className="form-input"
                  value={externalUrl}
                  onChange={(event) => {
                    setExternalUrl(event.target.value);
                    setFeedback(null);
                  }}
                  placeholder="资源链接（选填，例如网盘链接或在线文档地址）"
                />
                <div className="upload-section">
                  <label className="upload-btn">
                    上传附件
                    <input type="file" hidden onChange={onAnswerFiles} />
                  </label>
                  <span className="upload-tip">支持pdf/zip/rar/doc/png，单个≤100MB</span>
                </div>
                {answerFiles.map((file) => (
                  <div className="attach-item" key={`${file.name}-${file.size}`}>
                    <div className="attach-info">
                      <div className="attach-name">{file.name}</div>
                      <div className="attach-size">{formatFileSize(file.size)}</div>
                    </div>
                    <button className="download-btn" type="button" onClick={() => removeAnswerFile(file)}>
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="comment-submit-row">
              <button className="btn-primary" onClick={submit} disabled={addComment.isPending}>
                {addComment.isPending ? '提交中...' : isResource ? '发表评论' : '提交回答'}
              </button>
            </div>
            {feedback && <div className={`form-feedback ${feedback.type}`}>{feedback.text}</div>}
          </>
        )}

        <div className="comment-list">
          {comments.map((item) => (
            <div className="comment-item" key={item.id}>
              <div className="comment-actions">
                {item.mine && (
                  <button className="comment-delete" onClick={() => removeComment(item)} disabled={deleteComment.isPending}>
                    删除
                  </button>
                )}
                <button className="comment-reply" onClick={() => setReplyingTo(item)}>
                  回复
                </button>
                <button className="comment-report" onClick={() => reportComment(item)}>
                  举报
                </button>
                {!isResource && canAcceptAnswer && !item.accepted && !isOwner(item.author) && (
                  <button className="comment-accept" onClick={() => acceptAnswer(item)} disabled={acceptingAnswerId === item.id}>
                    {acceptingAnswerId === item.id ? '采纳中...' : '采纳回答'}
                  </button>
                )}
              </div>

              <div className="comment-user">
                <div className="comment-avatar">{item.author.slice(0, 1)}</div>
                <div className="comment-name">{item.author}</div>
                {isOwner(item.author) && <span className="comment-role">发布者</span>}
                {item.accepted && <span className="comment-accepted">已采纳</span>}
                <span className="comment-date">{item.date}</span>
              </div>
              <div className="comment-content">{item.content}</div>
              {item.externalUrl && (
                <a className="comment-link" href={item.externalUrl} target="_blank" rel="noreferrer">
                  {item.externalUrl}
                </a>
              )}
              {item.resourceId ? <div className="tip comment-resource-link">关联资源 #{item.resourceId}</div> : null}
              {item.attachments?.length ? (
                <div className="comment-attachments">
                  {item.attachments.map((attachment) => (
                    <div className="attach-item" key={attachment.id}>
                      <div className="attach-info">
                        <div className="attach-name">{attachment.name}</div>
                        <div className="attach-size">{attachment.size}</div>
                      </div>
                      <button className="download-btn" type="button" onClick={() => downloadAnswerAttachment(attachment)} disabled={downloadAttachment.isPending || downloadFileFromUrl.isPending}>
                        下载
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {replyingTo?.id === item.id && (
                <div className="reply-editor">
                  <div className="reply-editor-title">回复 {item.author}</div>
                  <textarea
                    className="reply-input"
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    placeholder={`回复 ${item.author}，内容会显示在这条评论下方`}
                  />
                  <div className="reply-editor-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                    >
                      取消
                    </button>
                    <button className="btn-primary" onClick={() => submitReply(item)} disabled={addComment.isPending}>
                      发布回复
                    </button>
                  </div>
                </div>
              )}

              {item.replies?.length ? (
                <div className="reply-box">
                  {item.replies.map((reply) => (
                    <div className="reply-item" key={reply.id}>
                      <div className="reply-line">
                        <span className="reply-author">{reply.author}</span>
                        {isOwner(reply.author) && <span className="comment-role">发布者</span>}
                        <span className="reply-target">回复 {reply.replyToAuthor || item.author}</span>
                        <span className="reply-date">{reply.date}</span>
                        <button className="reply-report" onClick={() => reportComment(reply)}>
                          举报
                        </button>
                      </div>
                      <div className="reply-content">{reply.content}</div>
                      {reply.externalUrl && (
                        <a className="comment-link" href={reply.externalUrl} target="_blank" rel="noreferrer">
                          {reply.externalUrl}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {!comments.length && <div className="tip empty-comments">暂无评论，来发布第一条吧</div>}
        </div>
      </div>

      <ReportModal open={Boolean(reportTarget)} target="COMMENT" targetId={reportTarget?.id || 0} subjectTitle={reportTarget?.title} onClose={() => setReportTarget(null)} />
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName || 'attachment';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
