// Types cho Support module: tách riêng để client component có thể import

export interface SupportRequestInput {
  description: string;
  imageUrl?: string | null;
}

export interface SupportRequestResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    created_at: Date;
  };
}
