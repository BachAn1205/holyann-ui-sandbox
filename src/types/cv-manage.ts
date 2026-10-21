/** CV slot từ `GET .../manage-upload/cv-documents` */
export type CvManageRow = {
  id: string;
  slot_index: number;
  file_url: string;
  /** Key S3 — có sau migration + upload lại */
  storage_path?: string | null;
  file_name: string;
  uploaded_at: string;
  cv_verified_at?: string | null;
  cv_validation?: unknown;
};
