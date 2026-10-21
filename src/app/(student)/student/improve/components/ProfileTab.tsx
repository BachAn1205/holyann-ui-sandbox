'use client';

import React, { useState } from 'react';
import { UserCircle, Loader2, BarChart3, Wand2, Star, Target, Shield, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProfileDataState } from '../types';
import { safeText } from '../utils';
import { FormattedText } from './FormattedText';
import { ModalSection, CollapsibleSection } from './ModalSections';

export interface ProfileTabProps {
  profileData: ProfileDataState | null;
  profileDataLoading: boolean;
  resultsLoading: boolean;
  profileAnalysis: Record<string, unknown> | null;
  profileEnhance: Record<string, unknown> | null;
  profileAnalysisLoading: boolean;
  profileEnhanceLoading: boolean;
  analysisRating: number | null;
  enhanceRating: number | null;
  onAnalysis: () => void;
  onEnhance: () => void;
  setDetailModal: (v: { title: string; content: React.ReactNode } | null) => void;
  saveRating: (kind: 'analysis' | 'enhance', value: number) => void;
}

export function ProfileTab({
  profileData,
  profileDataLoading,
  resultsLoading,
  profileAnalysis,
  profileEnhance,
  profileAnalysisLoading,
  profileEnhanceLoading,
  analysisRating,
  enhanceRating,
  onAnalysis,
  onEnhance,
  setDetailModal,
  saveRating,
}: ProfileTabProps) {
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-0.5 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          Hồ sơ của bạn
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Chạy phân tích hoặc nhận gợi ý cải thiện bên dưới.
        </p>

        {profileDataLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Đang tải...
          </div>
        ) : profileData ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setProfileDetailsOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-4 text-left shadow-sm hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">
                {profileData.feature1_output?.summary?.total_pillar_scores
                  ? '4 pillars · '
                  : ''}
                {profileData.feature1_output?.summary?.main_spike
                  ? `Spike: ${profileData.feature1_output.summary.main_spike}`
                  : profileData.feature2_output?.assessment?.mbti?.personality_type
                    ? `MBTI ${profileData.feature2_output.assessment.mbti.personality_type}`
                    : 'Profile data'}
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', profileDetailsOpen && 'rotate-180')} />
            </button>
            {profileDetailsOpen && (
              <div className="space-y-6 rounded-2xl border border-border/60 bg-muted/20 p-6">
                {profileData.feature1_output?.summary?.total_pillar_scores && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Trụ cột</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'aca', label: 'Học thuật' },
                        { key: 'lan', label: 'Ngoại ngữ' },
                        { key: 'hdnk', label: 'Hoạt động' },
                        { key: 'skill', label: 'Kỹ năng' },
                      ].map(({ key, label }) => {
                        const score = profileData.feature1_output?.summary?.total_pillar_scores?.[key];
                        return (
                          <div key={key} className="rounded-xl border border-border/60 bg-card p-3">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-lg font-semibold text-primary">{score != null ? Number(score) : ':'}</p>
                          </div>
                        );
                      })}
                    </div>
                    {(profileData.feature1_output.summary.main_spike || profileData.feature1_output.summary.sharpness) && (
                      <p className="text-xs text-muted-foreground mt-3">Spike: {profileData.feature1_output.summary.main_spike ?? ':'} · {profileData.feature1_output.summary.sharpness ?? ':'}</p>
                    )}
                  </div>
                )}
                {profileData.feature2_output?.assessment && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Đánh giá</p>
                    <div className="flex flex-wrap gap-3">
                      {profileData.feature2_output.assessment.mbti?.personality_type && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-2">
                          <span className="text-xs text-muted-foreground">MBTI </span>
                          <span className="text-sm font-medium">{profileData.feature2_output.assessment.mbti.personality_type}</span>
                        </div>
                      )}
                      {(profileData.feature2_output.assessment.grit?.score != null || profileData.feature2_output.assessment.grit?.level) && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-2">
                          <span className="text-xs text-muted-foreground">Grit </span>
                          <span className="text-sm font-medium">{profileData.feature2_output.assessment.grit?.score ?? ':'} ({profileData.feature2_output.assessment.grit?.level ?? ''})</span>
                        </div>
                      )}
                      {profileData.feature2_output.assessment.riasec?.code && (
                        <div className="rounded-xl border border-border/60 bg-card px-4 py-2">
                          <span className="text-xs text-muted-foreground">RIASEC </span>
                          <span className="text-sm font-medium">{profileData.feature2_output.assessment.riasec.code}</span>
                        </div>
                      )}
                      {!profileData.feature2_output.assessment.mbti?.personality_type &&
                        !profileData.feature2_output.assessment.grit?.score &&
                        !profileData.feature2_output.assessment.riasec?.code && (
                          <p className="text-xs text-muted-foreground">Chưa có kết quả đánh giá.</p>
                        )}
                    </div>
                  </div>
                )}
                {profileData.feature3_output?.universities && typeof profileData.feature3_output.universities === 'object' && Object.keys(profileData.feature3_output.universities as object).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Trường</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'REACH' as const, label: 'Reach', Icon: Star },
                        { key: 'MATCH' as const, label: 'Match', Icon: Target },
                        { key: 'SAFETY' as const, label: 'Safety', Icon: Shield },
                      ].map(({ key, label, Icon }) => {
                        const block = profileData.feature3_output?.universities?.[key];
                        const list = block?.universities ?? [];
                        return (
                          <div key={key} className="rounded-xl border border-border/60 bg-card overflow-hidden border-l-4 border-l-primary">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">{label}</span>
                              <span className="text-xs text-muted-foreground">{list.length}</span>
                            </div>
                            <ul className="p-3 space-y-1.5 max-h-32 overflow-y-auto text-xs text-foreground">
                              {list.length === 0 ? (
                                <li className="text-muted-foreground">:</li>
                              ) : (
                                list.map((uni, i) => (
                                  <li key={uni.id ?? i} className="truncate" title={[uni.name, uni.country].filter(Boolean).join(' · ')}>
                                    <span className="font-medium">{uni.name}</span>
                                    {(uni.country || uni.ranking != null) && (
                                      <span className="text-muted-foreground block truncate">
                                        {[uni.country, uni.ranking != null ? `#${uni.ranking}` : null].filter(Boolean).join(' · ')}
                                      </span>
                                    )}
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-6">
            <p className="text-sm text-muted-foreground">Hoàn thành hồ sơ và bài đánh giá để xem dữ liệu tại đây.</p>
          </div>
        )}

        {resultsLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải kết quả đã lưu...
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-border/60">
          <button
            type="button"
            onClick={onAnalysis}
            disabled={profileAnalysisLoading || profileEnhanceLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm font-medium hover:bg-muted/50 hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            {profileAnalysisLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <BarChart3 className="h-4 w-4 text-primary" />}
            {profileAnalysis ? 'Phân tích lại' : 'Phân tích'}
          </button>
          <button
            type="button"
            onClick={onEnhance}
            disabled={profileEnhanceLoading || profileAnalysisLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/50 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {profileEnhanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {profileEnhance ? 'Cải thiện lại' : 'Nhận gợi ý'}
          </button>
        </div>
        {(profileAnalysisLoading || profileEnhanceLoading) && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Processing… 1–2 min. Don’t close this page.
          </p>
        )}
      </div>

      {profileAnalysis && typeof profileAnalysis === 'object' && (() => {
        const scores = (profileAnalysis.pillar_scores && typeof profileAnalysis.pillar_scores === 'object'
          ? profileAnalysis.pillar_scores
          : (profileAnalysis.feature1_output as Record<string, unknown>)?.summary && typeof (profileAnalysis.feature1_output as Record<string, unknown>).summary === 'object'
            ? ((profileAnalysis.feature1_output as Record<string, unknown>).summary as Record<string, unknown>).total_pillar_scores
            : null) as Record<string, number> | null;
        const pillarLabels: Record<string, string> = { aca: 'Học thuật', lan: 'Ngôn ngữ', hdnk: 'Hoạt động', skill: 'Kỹ năng' };
        const overallFeedback = profileAnalysis.overall && typeof profileAnalysis.overall === 'object'
          ? String(safeText((profileAnalysis.overall as { feedback?: unknown }).feedback) || safeText((profileAnalysis.overall as { summary?: unknown }).summary) || '')
          : '';
        const openAnalysisDetail = () => {
          const overall = profileAnalysis.overall && typeof profileAnalysis.overall === 'object' ? profileAnalysis.overall as Record<string, unknown> : null;
          setDetailModal({
            title: 'Kết quả phân tích',
            content: (
              <div className="space-y-4">
                {overall && overall.overall_score != null && (
                  <ModalSection title="Điểm tổng quát" accent="violet">
                    <p className="text-lg font-semibold text-violet-600 dark:text-violet-400">{Number(overall.overall_score)}/100</p>
                    {(overall.personal_fit_score != null) && <p className="text-sm text-muted-foreground mt-1">Phù hợp bản thân: {Number(overall.personal_fit_score)}/100</p>}
                  </ModalSection>
                )}
                {overall && (safeText(overall.feedback) || safeText(overall.summary) || safeText(overall.personal_fit_feedback)) && (
                  <CollapsibleSection title="Nhận xét & phù hợp" summary="Bấm để xem" accent="violet">
                    {(safeText(overall.feedback) || safeText(overall.summary)) && <FormattedText text={safeText(overall.feedback) || safeText(overall.summary)} />}
                    {safeText(overall.personal_fit_feedback) && <div className="mt-3 pt-3 border-t border-border/60"><FormattedText text={safeText(overall.personal_fit_feedback)} /></div>}
                  </CollapsibleSection>
                )}
                {Boolean(scores && Object.keys(scores).length > 0 && profileAnalysis.pillars && typeof profileAnalysis.pillars === 'object') && (
                  <CollapsibleSection title="Chi tiết từng trụ cột" summary="4 trụ · bấm để xem" accent="emerald">
                    <div className="space-y-3">
                      {['aca', 'lan', 'hdnk', 'skill'].map((key) => {
                        const data = (profileAnalysis.pillars as Record<string, unknown>)[key];
                        if (!data || typeof data !== 'object') return null;
                        const d = data as Record<string, unknown>;
                        const score = typeof d.score === 'number' ? d.score : scores?.[key];
                        const feedback = safeText(d.feedback);
                        const strengths = Array.isArray(d.strengths) ? d.strengths : [];
                        const weaknesses = Array.isArray(d.weaknesses) ? d.weaknesses : [];
                        const suggestions = Array.isArray(d.suggestions) ? d.suggestions : [];
                        return (
                          <div key={key} className="rounded-lg border border-border/40 bg-background/60 p-3">
                            <p className="text-sm font-semibold text-foreground">{pillarLabels[key]}: <span className="text-emerald-600 dark:text-emerald-400">{score != null ? Number(score) : ':'}/100</span></p>
                            {feedback ? <FormattedText text={feedback} className="mt-2" /> : null}
                            {strengths.length > 0 && <p className="text-xs text-muted-foreground mt-2">Điểm mạnh: {strengths.map((s: unknown) => safeText(s)).join(' • ')}</p>}
                            {weaknesses.length > 0 && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Điểm yếu: {weaknesses.map((w: unknown) => safeText(w)).join(' • ')}</p>}
                            {suggestions.length > 0 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Gợi ý: {suggestions.map((g: unknown) => safeText(g)).join(' • ')}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                )}
                {overall && Array.isArray(overall.priority_suggestions) && overall.priority_suggestions.length > 0 && (
                  <CollapsibleSection title="Gợi ý ưu tiên" summary={`${overall.priority_suggestions.length} mục`} accent="amber">
                    <ul className="space-y-4">
                      {(overall.priority_suggestions as unknown[]).map((p, i) => {
                        const raw = safeText(p);
                        const match = raw.match(/^\s*\*{0,2}(\d+)\.\s*(.+?)\*{0,2}:\s*([\s\S]*)/);
                        const num = match ? match[1] : String(i + 1);
                        const title = match ? match[2].replace(/\*+/g, '').trim() : null;
                        const body = match ? match[3].trim() : raw;
                        return (
                          <li key={i} className="flex gap-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                              {num}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              {title && <p className="font-semibold text-foreground text-sm">{title}</p>}
                              <FormattedText text={body} className="text-sm text-muted-foreground leading-relaxed" />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleSection>
                )}
              </div>
            ),
          });
        };
        const overallScore = profileAnalysis.overall && typeof profileAnalysis.overall === 'object'
          ? (profileAnalysis.overall as { overall_score?: number }).overall_score
          : null;
        const oneLineFeedback = overallFeedback ? overallFeedback.trim().split(/\s+/).slice(0, 12).join(' ') + (overallFeedback.split(/\s+/).length > 12 ? '…' : '') : '';
        return (
          <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phân tích</h3>
                  <p className="text-3xl font-bold tabular-nums text-foreground mt-0.5">
                    {overallScore != null ? Number(overallScore) : ':'}<span className="text-lg font-medium text-muted-foreground">/100</span>
                  </p>
                </div>
                <button type="button" onClick={openAnalysisDetail} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0">
                  Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {oneLineFeedback && (
                <p className="text-sm text-muted-foreground line-clamp-2">{oneLineFeedback}</p>
              )}
              {scores && Object.keys(scores).length > 0 && (
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${overallScore != null ? Math.min(100, Math.max(0, overallScore)) : 0}%` }}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Rate:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => saveRating('analysis', n)} className="p-0.5 rounded hover:bg-muted/50" title={`${n} stars`}>
                    <Star className={cn('h-4 w-4', analysisRating != null && n <= analysisRating ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                  </button>
                ))}
                {analysisRating != null && <span className="text-xs text-muted-foreground">{analysisRating}/5</span>}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {profileEnhance && typeof profileEnhance === 'object' && (() => {
        const recs = Array.isArray(profileEnhance.recommendations) ? (profileEnhance.recommendations as Record<string, unknown>[]) : [];
        const openEnhanceDetail = () => {
          setDetailModal({
            title: 'Đề xuất cải thiện',
            content: (
              <div className="space-y-4">
                {recs.length > 0 && (
                  <CollapsibleSection title="Khuyến nghị" summary={`${recs.length} mục · bấm để xem`} accent="sky">
                    <ul className="space-y-3">
                      {recs.map((r, i) => {
                        const name = safeText(r.specific_rec_name);
                        const reason = safeText(r.reason);
                        const actionPlan = Array.isArray(r.action_plan_details) ? (r.action_plan_details as unknown[]).map((a) => safeText(a)) : [];
                        const resourceLink = safeText(r.resource_link);
                        const estimatedTime = safeText(r.estimated_time);
                        return (
                          <li key={i} className="rounded-lg border border-border/40 bg-background/60 p-3">
                            <p className="font-medium text-sky-700 dark:text-sky-300">{name || `#${i + 1}`}</p>
                            {reason && <FormattedText text={reason} className="mt-2 text-sm" />}
                            {actionPlan.filter(Boolean).length > 0 && (
                              <ul className="text-sm text-foreground mt-2 list-disc list-inside space-y-0.5">
                                {actionPlan.filter(Boolean).map((step, j) => <li key={j}>{step}</li>)}
                              </ul>
                            )}
                            {(resourceLink || estimatedTime) && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {resourceLink ? <a href={resourceLink} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 underline">Tài liệu</a> : null}
                                {resourceLink && estimatedTime ? ' · ' : null}
                                {estimatedTime ? `Ước tính: ${estimatedTime}` : null}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleSection>
                )}
                {Array.isArray(profileEnhance.improvements) && profileEnhance.improvements.length > 0 && (
                  <CollapsibleSection title="Cải thiện theo trụ cột" summary={`${profileEnhance.improvements.length} mục`} accent="amber">
                    <ul className="space-y-1 text-sm">
                      {(profileEnhance.improvements as Record<string, unknown>[]).map((imp, i) => (
                        <li key={i}><span className="text-amber-700 dark:text-amber-300 font-medium">{safeText(imp.pillar)}</span>: {safeText(imp.current_score)} → {safeText(imp.target_score)}{safeText(imp.what_improved) ? `: ${safeText(imp.what_improved)}` : ''}</li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}
                {safeText(profileEnhance.enhanced_summary) && (
                  <CollapsibleSection title="Tóm tắt" summary="Bấm để xem" accent="violet">
                    <FormattedText text={safeText(profileEnhance.enhanced_summary)} />
                  </CollapsibleSection>
                )}
                {recs.length === 0 && !profileEnhance.enhanced_summary && (!Array.isArray(profileEnhance.improvements) || profileEnhance.improvements.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nội dung đang cập nhật.</p>
                )}
              </div>
            ),
          });
        };
        const firstRec = recs[0];
        const insightLine = firstRec
          ? (safeText(firstRec.specific_rec_name) || safeText(firstRec.reason) || '').trim().split(/\s+/).slice(0, 12).join(' ') + '…'
          : safeText(profileEnhance.enhanced_summary)
            ? safeText(profileEnhance.enhanced_summary).trim().split(/\s+/).slice(0, 12).join(' ') + '…'
            : '';
        return (
          <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Suggestions</h3>
                  <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                    {recs.length} <span className="text-base font-medium text-muted-foreground">recommendations</span>
                  </p>
                </div>
                <button type="button" onClick={openEnhanceDetail} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0">
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {insightLine && (
                <p className="text-sm text-muted-foreground line-clamp-2">{insightLine}</p>
              )}
              {recs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recs.slice(0, 3).map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{safeText(r.priority) || `#${i + 1}`}</Badge>
                  ))}
                  {recs.length > 3 && <span className="text-xs text-muted-foreground">+{recs.length - 3}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Rate:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => saveRating('enhance', n)} className="p-0.5 rounded hover:bg-muted/50" title={`${n} stars`}>
                    <Star className={cn('h-4 w-4', enhanceRating != null && n <= enhanceRating ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                  </button>
                ))}
                {enhanceRating != null && <span className="text-xs text-muted-foreground">{enhanceRating}/5</span>}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
