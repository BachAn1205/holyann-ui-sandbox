'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { MentorWithUser, Achievement } from '@/types/mentor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  getMentorSpecializationLabel,
  mergeMentorForm,
} from '@/components/mentor/profile/mentor-profile-data';

const sectionModal =
  'rounded-xl border border-border/80 bg-muted/20 p-4 text-foreground sm:p-5';

export interface MentorProfileFormProps {
  initialData: Partial<MentorWithUser>;
  /** Gọi sau khi PUT thành công (cha refetch / đóng modal). */
  onSaved?: () => void | Promise<void>;
  /** Bố cục form trong modal (section nhỏ gọn hơn). */
  compact?: boolean;
}

export default function MentorProfileForm({
  initialData,
  onSaved,
  compact = false,
}: MentorProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<MentorWithUser>>(() =>
    mergeMentorForm(initialData),
  );

  const [newExpertise, setNewExpertise] = useState('');
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    setFormData(mergeMentorForm(initialData));
  }, [initialData]);

  const sectionCard = compact ? sectionModal : 'rounded-2xl border-2 border-[#111827]/12 bg-card p-5 text-foreground pc-sticker-shadow dark:border-white/15 sm:p-6';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/mentor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            full_name: formData.user?.full_name,
            phone_number: formData.user?.phone_number,
            avatar_url: formData.user?.avatar_url,
          },
          bio: formData.bio,
          linkedin_url: formData.linkedin_url,
          website_url: formData.website_url,
          university_name: formData.university_name,
          degree: formData.degree,
          major: formData.major,
          graduation_year: formData.graduation_year,
          current_company: formData.current_company,
          current_job_title: formData.current_job_title,
          years_of_experience: formData.years_of_experience,
          expertises: formData.expertises,
          outstanding_achievements: formData.outstanding_achievements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await response.json();
      toast.success('Cập nhật hồ sơ thành công!');
      await onSaved?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertises?.includes(newExpertise.trim())) {
      setFormData({
        ...formData,
        expertises: [...(formData.expertises || []), newExpertise.trim()],
      });
      setNewExpertise('');
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData({
      ...formData,
      expertises: formData.expertises?.filter((e) => e !== expertise) || [],
    });
  };

  const addAchievement = () => {
    if (newAchievement.title.trim()) {
      setFormData({
        ...formData,
        outstanding_achievements: [
          ...(formData.outstanding_achievements || []),
          { ...newAchievement },
        ],
      });
      setNewAchievement({ title: '', year: new Date().getFullYear() });
    }
  };

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      outstanding_achievements:
        formData.outstanding_achievements?.filter((_, i) => i !== index) || [],
    });
  };

  const avatarUrl = formData.user?.avatar_url;
  const showAvatar =
    avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'));

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', compact ? 'sm:space-y-5' : 'space-y-5 sm:space-y-6')}>
      <div className={sectionCard}>
        <h4
          className={cn(
            'mb-4 border-b border-border pb-2 text-base font-semibold text-foreground',
            !compact && 'mb-5 pb-3 text-lg',
          )}
        >
          Thông tin cơ bản
        </h4>

        <div className="space-y-4">
          <div>
            <Label className="text-foreground">Ảnh đại diện</Label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#111827]/15 bg-gradient-to-br from-primary/90 to-primary text-2xl font-bold text-primary-foreground dark:border-white/20">
                {showAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl!}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{formData.user?.full_name?.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2">
                  <Upload className="h-4 w-4" />
                  Cập nhật ảnh qua quản trị (sắp có)
                </p>
                <p className="mt-1">PNG, JPG tối đa 2MB</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="mentor-full_name" className="text-foreground">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mentor-full_name"
              required
              value={formData.user?.full_name || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  user: { ...formData.user!, full_name: e.target.value },
                })
              }
              className="mt-1.5 rounded-xl border-2"
            />
          </div>

          <div>
            <Label htmlFor="mentor-email" className="text-foreground">
              Email
            </Label>
            <Input
              id="mentor-email"
              type="email"
              disabled
              value={formData.user?.email || ''}
              className="mt-1.5 rounded-xl border-2 bg-muted/50"
            />
          </div>

          <div>
            <Label htmlFor="mentor-phone_number" className="text-foreground">
              Số điện thoại
            </Label>
            <Input
              id="mentor-phone_number"
              type="tel"
              value={formData.user?.phone_number || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  user: { ...formData.user!, phone_number: e.target.value },
                })
              }
              className="mt-1.5 rounded-xl border-2"
            />
          </div>
        </div>
      </div>

      <div className={sectionCard}>
        <h4
          className={cn(
            'mb-4 border-b border-border pb-2 text-base font-semibold text-foreground',
            !compact && 'mb-5 pb-3 text-lg',
          )}
        >
          Thông tin chuyên môn
        </h4>

        <div className="space-y-4">
          <div>
            <Label htmlFor="mentor-specialization" className="text-foreground">
              Chuyên môn
            </Label>
            <Input
              id="mentor-specialization"
              disabled
              value={getMentorSpecializationLabel(formData.specialization)}
              className="mt-1.5 rounded-xl border-2 bg-muted/50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Chuyên môn được gán bởi hệ thống và không thể thay đổi
            </p>
          </div>

          <div>
            <Label htmlFor="mentor-bio" className="text-foreground">
              Giới thiệu
            </Label>
            <Textarea
              id="mentor-bio"
              rows={compact ? 3 : 4}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1.5 rounded-xl border-2"
              placeholder="Giới thiệu ngắn về bản thân và kinh nghiệm..."
            />
          </div>

          <div>
            <Label htmlFor="mentor-linkedin_url" className="text-foreground">
              LinkedIn URL
            </Label>
            <Input
              id="mentor-linkedin_url"
              type="url"
              value={formData.linkedin_url || ''}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              className="mt-1.5 rounded-xl border-2"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <Label htmlFor="mentor-website_url" className="text-foreground">
              Website
            </Label>
            <Input
              id="mentor-website_url"
              type="url"
              value={formData.website_url || ''}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="mt-1.5 rounded-xl border-2"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="mentor-university_name" className="text-foreground">
                Trường đại học
              </Label>
              <Input
                id="mentor-university_name"
                value={formData.university_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, university_name: e.target.value })
                }
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
            <div>
              <Label htmlFor="mentor-major" className="text-foreground">
                Chuyên ngành
              </Label>
              <Input
                id="mentor-major"
                value={formData.major || ''}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="mentor-degree" className="text-foreground">
                Bằng cấp
              </Label>
              <Input
                id="mentor-degree"
                value={formData.degree || ''}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
            <div>
              <Label htmlFor="mentor-graduation_year" className="text-foreground">
                Năm tốt nghiệp
              </Label>
              <Input
                id="mentor-graduation_year"
                type="number"
                value={formData.graduation_year ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    graduation_year: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="mentor-current_company" className="text-foreground">
                Công ty hiện tại
              </Label>
              <Input
                id="mentor-current_company"
                value={formData.current_company || ''}
                onChange={(e) =>
                  setFormData({ ...formData, current_company: e.target.value })
                }
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
            <div>
              <Label htmlFor="mentor-current_job_title" className="text-foreground">
                Chức vụ
              </Label>
              <Input
                id="mentor-current_job_title"
                value={formData.current_job_title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, current_job_title: e.target.value })
                }
                className="mt-1.5 rounded-xl border-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mentor-years_of_experience" className="text-foreground">
              Số năm kinh nghiệm
            </Label>
            <Input
              id="mentor-years_of_experience"
              type="number"
              min={0}
              value={formData.years_of_experience ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  years_of_experience: parseInt(e.target.value, 10) || 0,
                })
              }
              className="mt-1.5 max-w-48 rounded-xl border-2"
            />
          </div>
        </div>
      </div>

      <div className={sectionCard}>
        <h4
          className={cn(
            'mb-3 border-b border-border pb-2 text-base font-semibold text-foreground',
            !compact && 'mb-4 pb-3 text-lg',
          )}
        >
          Lĩnh vực chuyên môn
        </h4>

        <div className="mb-4 flex flex-wrap gap-2">
          {formData.expertises?.map((expertise) => (
            <span
              key={expertise}
              className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {expertise}
              <button
                type="button"
                onClick={() => removeExpertise(expertise)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Xóa ${expertise}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addExpertise();
              }
            }}
            placeholder="Thêm lĩnh vực chuyên môn..."
            className="flex-1 rounded-xl border-2"
          />
          <Button type="button" variant="secondary" onClick={addExpertise} className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm
          </Button>
        </div>
      </div>

      <div className={sectionCard}>
        <h4
          className={cn(
            'mb-3 border-b border-border pb-2 text-base font-semibold text-foreground',
            !compact && 'mb-4 pb-3 text-lg',
          )}
        >
          Thành tích nổi bật
        </h4>

        <div className="mb-4 space-y-2">
          {formData.outstanding_achievements?.map((achievement: Achievement, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="min-w-0">
                <span className="font-medium text-foreground">{achievement.title}</span>
                <span className="ml-2 text-sm text-muted-foreground">({achievement.year})</span>
              </div>
              <button
                type="button"
                onClick={() => removeAchievement(index)}
                className="shrink-0 text-destructive hover:text-destructive/80"
                aria-label="Xóa thành tích"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={newAchievement.title}
            onChange={(e) =>
              setNewAchievement({ ...newAchievement, title: e.target.value })
            }
            placeholder="Tên thành tích..."
            className="flex-1 rounded-xl border-2"
          />
          <Input
            type="number"
            value={newAchievement.year}
            onChange={(e) =>
              setNewAchievement({
                ...newAchievement,
                year: parseInt(e.target.value, 10) || new Date().getFullYear(),
              })
            }
            className="w-full rounded-xl border-2 sm:w-28"
          />
          <Button type="button" variant="secondary" onClick={addAchievement} className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className={cn(
            'pc-chip-primary gap-2 rounded-xl border-2 px-6 py-5 text-base font-semibold sm:py-4',
          )}
        >
          {isSaving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
