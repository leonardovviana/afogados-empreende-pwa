const sanitizeFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\.+(?=\.)/g, "");

const ensurePdfExtension = (fileName: string): string =>
  fileName.endsWith(".pdf") ? fileName : `${fileName.replace(/\.[^/.]+$/, "")}.pdf`;

const ensureImageExtension = (fileName: string, fallback = ".jpg"): string => {
  const match = fileName.match(/\.[a-z0-9]+$/i);
  return (match ? match[0] : fallback).toLowerCase();
};

export const buildBoletoFilePath = (registrationId: string, originalFileName: string): string => {
  const sanitizedName = sanitizeFileName(originalFileName);
  const safeBase = sanitizedName ? sanitizedName.replace(/\.[^/.]+$/, "") : "boleto";
  const fileName = ensurePdfExtension(safeBase);
  return `${registrationId}/${Date.now()}-${fileName}`;
};

export const buildPaymentProofFilePath = (
  registrationId: string,
  originalFileName: string
): string => {
  const sanitizedName = sanitizeFileName(originalFileName.replace(/\.[^/.]+$/, "")) || "comprovante";
  const extension = ensureImageExtension(originalFileName);
  return `${registrationId}/comprovantes/${Date.now()}-${sanitizedName}${extension}`;
};