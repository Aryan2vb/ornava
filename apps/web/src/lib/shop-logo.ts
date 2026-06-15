import { z } from "zod";

export const SHOP_LOGO_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const SHOP_LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

export const SHOP_LOGO_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type ShopLogoFileType = (typeof SHOP_LOGO_FILE_TYPES)[number];

const extensionByMimeType: Record<ShopLogoFileType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const uploadSchema = z.object({
  fileType: z.enum(SHOP_LOGO_FILE_TYPES),
  fileSizeBytes: z.number().int().min(1).max(SHOP_LOGO_MAX_SIZE_BYTES),
  width: z.number().int().min(100).max(2000),
  height: z.number().int().min(100).max(2000),
});

export function isSupportedShopLogoType(fileType: string): fileType is ShopLogoFileType {
  return SHOP_LOGO_FILE_TYPES.some((supportedType) => supportedType === fileType);
}

export function validateShopLogoUploadRequest(input: unknown) {
  return uploadSchema.parse(input);
}

export function buildShopLogoObjectKey(userId: string, fileType: ShopLogoFileType) {
  return `users/${userId}/branding/logo.${extensionByMimeType[fileType]}`;
}
