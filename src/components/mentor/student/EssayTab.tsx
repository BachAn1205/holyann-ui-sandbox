'use client';

import { useEffect, useState } from 'react';
import { Eye, FileText, Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import FilePreviewModal from '@/components/common/FilePreviewModal';
import { Button } from '@/components/ui/button';

interface EssayTabProps {
  studentId: string;
}

interface EssayItem {
  id: string;
  title: string | null;
  content: string;
  updated_at: string;
  _count?: { comments: number };
}

interface CommentItem {
  id: string;
  content: string;
  author: { id: string; full_name: string | null; email: string };
  created_at: string;
}

interface CvDocumentItem {
  id: string;
  slot_index: number;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  cv_verified_at: string | null;
}

const PREVIEW_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'bmp',
]);

function canPreviewCvFile(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return PREVIEW_EXTENSIONS.has(ext);
}

export default function EssayTab({ studentId }: EssayTabProps) {
  const [essays, setEssays] = useState<EssayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvDocs, setCvDocs] = useState<CvDocumentItem[]>([]);
  const [cvLoading, setCvLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [essayDetail, setEssayDetail] = useState<{ content: string; comments: CommentItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  useEffect(() => {
    const fetchEssays = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mentor/students/${studentId}/essays`);
        if (res.ok) {
          const json = await res.json();
          setEssays(json.data || []);
          if (json.data?.length > 0 && !selectedId) setSelectedId(json.data[0].id);
        }
      } catch (e) {
        console.error(e);
        toast.error('Không tải được danh sách luận');
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();
  }, [studentId]);

  useEffect(() => {
    const fetchCvDocs = async () => {
      setCvLoading(true);
      try {
        const res = await fetch(`/api/mentor/students/${studentId}/cv-documents`);
        if (!res.ok) {
          setCvDocs([]);
          return;
        }
        const json = await res.json();
        setCvDocs((json.data || []) as CvDocumentItem[]);
      } catch (e) {
        console.error(e);
        setCvDocs([]);
      } finally {
        setCvLoading(false);
      }
    };

    fetchCvDocs();
  }, [studentId]);

  useEffect(() => {
    if (!selectedId) {
      setEssayDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/mentor/students/${studentId}/essays/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tải được bài luận');
        return res.json();
      })
      .then((json) => {
        const e = json.data;
        setEssayDetail({
          content: e.content || '',
          comments: (e.comments || []).map((c: CommentItem) => ({
            id: c.id,
            content: c.content,
            author: c.author,
            created_at: c.created_at,
          })),
        });
      })
      .catch(() => {
        setEssayDetail(null);
        toast.error('Không tải được bài luận');
      })
      .finally(() => setDetailLoading(false));
  }, [studentId, selectedId]);

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || !selectedId) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/student/essays/${selectedId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gửi comment thất bại');
      }
      const json = await res.json();
      const newComment = json.data;
      setEssayDetail((prev) =>
        prev
          ? { ...prev, comments: [...prev.comments, { id: newComment.id, content: newComment.content, author: newComment.author, created_at: newComment.created_at }] }
          : prev
      );
      setCommentText('');
      toast.success('Đã gửi nhận xét');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi gửi comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">CV đã tải lên</span>
        </div>
        <div className="p-4 sm:p-6">
          {cvLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải CV...
            </div>
          ) : cvDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có CV nào.</p>
          ) : (
            <ul className="space-y-2">
              {cvDocs.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-foreground truncate min-w-0">
                        Slot {doc.slot_index}:{' '}
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {doc.file_name}
                        </a>
                      </div>
                      {canPreviewCvFile(doc.file_name) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 shrink-0"
                          onClick={() =>
                            setPreviewModal({
                              isOpen: true,
                              fileUrl: doc.file_url,
                              fileName: doc.file_name,
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem
                        </Button>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Tải lên: {new Date(doc.uploaded_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {doc.cv_verified_at ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Đã xác minh
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-muted/80">
                        Chưa xác minh
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {essays.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-60" />
          <p>Học viên chưa có bài luận nào.</p>
        </div>
      ) : (
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">Chọn bài luận:</span>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="rounded-lg border border-input bg-background text-foreground text-sm px-3 py-1.5"
          >
            {essays.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title || `Luận ${new Date(e.updated_at).toLocaleDateString('vi-VN')}`}
                {e._count?.comments != null ? ` (${e._count.comments} nhận xét)` : ''}
              </option>
            ))}
          </select>
        </div>
        {detailLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : essayDetail ? (
          <>
            <div
              className="font-essay px-4 sm:px-6 py-6 min-h-[200px] border-b border-border bg-muted dark:bg-muted/40 text-foreground [&_p]:text-foreground [&_p]:leading-relaxed [&_p]:my-3 [&_p]:text-[15px]"
              dangerouslySetInnerHTML={{ __html: essayDetail.content || '<p style="color: var(--muted-foreground)">(Trống)</p>' }}
            />
            <div className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Nhận xét
              </h3>
              <ul className="space-y-3 mb-4">
                {essayDetail.comments.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-sm text-foreground">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.author?.full_name || c.author?.email} · {new Date(c.created_at).toLocaleString('vi-VN')}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết nhận xét cho học viên..."
                  className="flex-1 min-h-[80px] rounded-lg border border-input bg-background text-foreground text-sm p-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="self-end inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-medium hover:bg-muted hover:border-primary/50 disabled:opacity-50"
                >
                  {submittingComment ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Send className="h-4 w-4 text-primary" />}
                  Gửi
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
      )}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
      />
    </div>
  );
}
