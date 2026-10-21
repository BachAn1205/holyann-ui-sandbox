'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    User,
    Calendar,
    MessageSquare,
    Download,
    Eye,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/PageLoading';

interface SubmittedFile {
    id: string;
    student_id: string;
    submission_url: string;
    status: 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION';
    completed_at: string;
    mentor_note?: string;
    students: {
        users: {
            full_name: string;
            email: string;
        }
    };
    checklist_tasks: {
        title: string;
        description?: string;
    };
}

export default function MentorReviewPage() {
    const [submissions, setSubmissions] = useState<SubmittedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmittedFile | null>(null);
    const [mentorNote, setMentorNote] = useState('');
    const [filter, setFilter] = useState<'all' | 'submitted' | 'completed' | 'needs_revision'>('submitted');

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const response = await fetch('/api/admin/submissions');
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data.submissions || []);
            } else {
                toast.error('Không thể tải danh sách file đã nộp');
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const updateSubmissionStatus = async (submissionId: string, status: 'COMPLETED' | 'NEEDS_REVISION', note?: string) => {
        setProcessingId(submissionId);
        try {
            const response = await fetch('/api/admin/submissions/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    submissionId,
                    status,
                    mentorNote: note,
                }),
            });

            if (response.ok) {
                toast.success(status === 'COMPLETED' ? 'Đã duyệt thành công!' : 'Đã gửi yêu cầu chỉnh sửa!');
                loadSubmissions(); // Reload data
                setSelectedSubmission(null);
                setMentorNote('');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error updating submission:', error);
            toast.error('Lỗi khi cập nhật trạng thái');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock size={14} className="mr-1"/> Chờ review</Badge>;
            case 'COMPLETED':
                return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1"/> Đã duyệt</Badge>;
            case 'NEEDS_REVISION':
                return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle size={14} className="mr-1"/> Cần sửa</Badge>;
            default:
                return <Badge variant="secondary">Chờ xử lý</Badge>;
        }
    };

    const filteredSubmissions = submissions.filter(submission => {
        if (filter === 'all') return true;
        return submission.status.toLowerCase() === filter.replace('_', '').toLowerCase();
    });

    if (loading) {
        return (
            <PageLoading message="Đang tải danh sách file..." />
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review File Học Viên</h1>
                <p className="text-gray-600">Duyệt CV, transcript và tài liệu khác của học viên</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6">
                <div className="flex gap-2">
                    {[
                        { key: 'submitted', label: 'Chờ review', count: submissions.filter(s => s.status === 'SUBMITTED').length },
                        { key: 'completed', label: 'Đã duyệt', count: submissions.filter(s => s.status === 'COMPLETED').length },
                        { key: 'needs_revision', label: 'Cần sửa', count: submissions.filter(s => s.status === 'NEEDS_REVISION').length },
                        { key: 'all', label: 'Tất cả', count: submissions.length }
                    ].map(tab => (
                        <Button
                            key={tab.key}
                            variant={filter === tab.key ? 'default' : 'outline'}
                            onClick={() => setFilter(tab.key as any)}
                            className="flex items-center gap-2"
                        >
                            {tab.label} ({tab.count})
                        </Button>
                    ))}
                </div>
            </div>

            {/* Submissions List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSubmissions.map((submission) => (
                    <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{submission.students.users.full_name}</CardTitle>
                                {getStatusBadge(submission.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User size={14}/>
                                {submission.students.users.email}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">{submission.checklist_tasks.title}</h4>
                                {submission.checklist_tasks.description && (
                                    <p className="text-sm text-gray-600">{submission.checklist_tasks.description}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14}/>
                                Nộp lúc: {new Date(submission.completed_at).toLocaleString('vi-VN')}
                            </div>

                            {submission.mentor_note && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageSquare size={14} className="text-blue-600"/>
                                        <span className="text-sm font-medium text-blue-800">Ghi chú mentor</span>
                                    </div>
                                    <p className="text-sm text-blue-700">{submission.mentor_note}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(submission.submission_url, '_blank')}
                                    className="flex-1"
                                >
                                    <Eye size={14} className="mr-1"/>
                                    Xem file
                                </Button>
                                {submission.status === 'SUBMITTED' && (
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedSubmission(submission)}
                                        className="flex-1"
                                    >
                                        Review
                                    </Button>
                                )}
                                {submission.status === 'NEEDS_REVISION' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateSubmissionStatus(submission.id, 'COMPLETED')}
                                        disabled={processingId === submission.id}
                                        className="flex-1"
                                    >
                                        <CheckCircle size={14} className="mr-1"/>
                                        Duyệt
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredSubmissions.length === 0 && (
                <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có file nào</h3>
                    <p className="text-gray-500">
                        {filter === 'submitted' && 'Chưa có file nào cần review'}
                        {filter === 'completed' && 'Chưa có file nào được duyệt'}
                        {filter === 'needs_revision' && 'Chưa có file nào cần chỉnh sửa'}
                        {filter === 'all' && 'Chưa có file nào được nộp'}
                    </p>
                </div>
            )}

            {/* Review Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)]">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Review File - {selectedSubmission.students.users.full_name}</CardTitle>
                            <p className="text-sm text-gray-600">{selectedSubmission.checklist_tasks.title}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(selectedSubmission.submission_url, '_blank')}
                                    className="flex-1"
                                >
                                    <Eye size={14} className="mr-1"/>
                                    Mở file trong tab mới
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = selectedSubmission.submission_url;
                                        link.download = 'file';
                                        link.click();
                                    }}
                                >
                                    <Download size={14} className="mr-1"/>
                                    Tải về
                                </Button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú cho học viên (tuỳ chọn)
                                </label>
                                <Textarea
                                    value={mentorNote}
                                    onChange={(e) => setMentorNote(e.target.value)}
                                    placeholder="Nhập ghi chú hoặc góp ý cho học viên..."
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'COMPLETED', mentorNote)}
                                    disabled={processingId === selectedSubmission.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle size={14} className="mr-1"/>
                                    Duyệt file
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => updateSubmissionStatus(selectedSubmission.id, 'NEEDS_REVISION', mentorNote || 'Cần chỉnh sửa lại file')}
                                    disabled={processingId === selectedSubmission.id}
                                    className="flex-1"
                                >
                                    <XCircle size={14} className="mr-1"/>
                                    Yêu cầu sửa
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedSubmission(null);
                                        setMentorNote('');
                                    }}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
