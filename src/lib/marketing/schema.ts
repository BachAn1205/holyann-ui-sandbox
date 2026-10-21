import { z } from 'zod';

const dateInputSchema = z
  .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .optional()
  .nullable();

export const marketingPostPayloadSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(500),
  slug: z.string().trim().max(500).optional().nullable(),
  excerpt: z.string().optional().nullable(),
  content: z.string().trim().min(1, 'Vui lòng nhập nội dung'),
  category: z.string().max(100).optional().nullable(),
  thumbnail_url: z.string().trim().max(500).optional().nullable(),
  cta_text: z.string().trim().max(100).optional().nullable(),
  cta_link: z.string().trim().max(500).optional().nullable(),
  deadline: dateInputSchema,
  target_publish_date: dateInputSchema,
  status: z.enum(['DRAFT', 'PUBLISHED']),
  meta_title: z.string().trim().max(255).optional().nullable(),
  meta_description: z.string().optional().nullable(),
  placement: z.string().max(100).optional().nullable(),
});

export type MarketingPostPayloadInput = z.infer<typeof marketingPostPayloadSchema>;

