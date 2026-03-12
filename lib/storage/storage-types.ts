export type UploadPhotoResult = {
  ok: boolean;
  path?: string;
  message: string;
  reason?: "env-missing" | "bucket-missing" | "auth-required" | "invalid-file" | "file-too-large" | "upload-error";
};

export type SignedUrlResult = {
  ok: boolean;
  url?: string;
  message: string;
  reason?: "env-missing" | "bucket-missing" | "not-found" | "not-published" | "no-photo" | "sign-error";
};

export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hora
