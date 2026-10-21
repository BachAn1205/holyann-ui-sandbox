const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const SEPARATOR_REGEX = /[^a-z0-9]+/g;
const TRIM_SEPARATOR_REGEX = /^-+|-+$/g;

export function slugifyVietnamese(input?: string | null, fallback = 'bai-viet') {
  const normalized = (input ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS_REGEX, '')
    .replace(/[dÐ]/g, (char) => (char === 'd' ? 'd' : 'D'))
    .toLowerCase()
    .trim()
    .replace(SEPARATOR_REGEX, '-')
    .replace(TRIM_SEPARATOR_REGEX, '');

  return normalized || fallback;
}

