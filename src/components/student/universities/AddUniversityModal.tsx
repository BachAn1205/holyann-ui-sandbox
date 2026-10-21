'use client';

import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type UniversityPayload = {
  id: number;
  qs_rank: number | null;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  type: string | null;
  website_url?: string | null;
  status?: 'APPROVED' | 'PENDING';
  created_by_user_id?: string | null;
  previous_rank?: string | null;
  size?: string | null;
  focus?: string | null;
  research_level?: string | null;
  qs_overall_score?: number | null;
  ranking_year?: number;
  academic_reputation?: number;
  employer_reputation?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialSearchTerm: string;
  onSuccess: (university: UniversityPayload) => void;
};

const REGIONS = [
  { value: 'Asia', label: 'Châu Á' },
  { value: 'Europe', label: 'Châu Âu' },
  { value: 'Americas', label: 'Châu Mỹ (QS)' },
  { value: 'North America', label: 'Bắc Mỹ' },
  { value: 'Oceania', label: 'Châu Đại Dương' },
  { value: 'Latin America', label: 'Mỹ Latin' },
  { value: 'Africa', label: 'Châu Phi' },
  { value: 'Middle East & Africa', label: 'Trung Đông & Châu Phi' },
];

export default function AddUniversityModal({ isOpen, onClose, initialSearchTerm, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState<{ country: string; region: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialSearchTerm?.trim() ?? '');
    setWebsiteUrl('');
    setRegion('');
    setCountry('');
  }, [initialSearchTerm, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void fetch('/api/universities/countries')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !Array.isArray(data?.countries)) return;
        setCountries(
          data.countries
            .map((x: { country?: string; region?: string | null }) => ({
              country: (x.country ?? '').trim(),
              region: x.region ?? null,
            }))
            .filter((x: { country: string }) => Boolean(x.country)),
        );
      })
      .catch(() => setCountries([]));
  }, [isOpen]);

  useEffect(() => {
    setCountry('');
  }, [region]);

  const countryOptions = Array.from(
    new Set(
      countries
        .filter((x) => !region || x.region === region)
        .map((x) => x.country),
    ),
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !websiteUrl.trim() || !region || !country) {
      toast.error('Vui lòng nhập đủ Tên trường, Website, Khu vực và Quốc gia.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          website_url: websiteUrl.trim(),
          region,
          country,
        }),
      });
      const data = await res.json();
      const university = data?.university as UniversityPayload | undefined;

      if ((res.status === 201 || res.status === 409) && university) {
        onSuccess(university);
        onClose();
        toast.success('Đã thêm trường vào danh sách đề xuất.');
        return;
      }

      toast.error(data?.error || 'Không thể đề xuất trường mới.');
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">Đề xuất trường mới</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Nếu chưa có trong hệ thống, bạn có thể gửi đề xuất để đội ngũ duyệt.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tên trường</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ví dụ: University of Example"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Website URL</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="https://www.example.edu"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Khu vực</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">Chọn khu vực</option>
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Quốc gia</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">Chọn quốc gia</option>
                  {countryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Gửi đề xuất
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Đóng"
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
