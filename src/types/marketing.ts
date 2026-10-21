export type MarketingPostStatus = 'DRAFT' | 'PUBLISHED';

export interface MarketingPostAuthor {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface MarketingPostPayload {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  thumbnail_url?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  deadline?: string | null;
  target_publish_date?: string | null;
  status: MarketingPostStatus;
  meta_title?: string | null;
  meta_description?: string | null;
  placement?: string | null;
}

export interface MarketingPostListItem {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  placement: string | null;
  status: MarketingPostStatus;
  target_publish_date: string | null;
  updated_at: string;
  created_at: string;
  author: MarketingPostAuthor;
}

export interface MarketingPostDetail extends MarketingPostPayload {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: MarketingPostAuthor;
}

export type MarketingPostFormValues = MarketingPostPayload;

