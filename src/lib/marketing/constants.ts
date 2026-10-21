export const MARKETING_ALLOWED_ROLES = ['ADMIN', 'MARKETING'] as const;

export const MARKETING_CATEGORY_OPTIONS = [
  'Tin tức',
  'Sự kiện',
  'Ưu đãi',
  'Thông báo',
] as const;

export const MARKETING_PLACEMENT_OPTIONS = [
  'Slider',
  'Banner',
  'Normal',
] as const;

export const MARKETING_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Đang làm' },
  { value: 'PUBLISHED', label: 'Đã xong' },
] as const;

