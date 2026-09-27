import imageCompression from "browser-image-compression";

export interface ProcessedImage {
  blob: Blob;
  path: string;
  contentType: string;
}

export async function processImage(
  file: File,
  userId: string,
  options: {
    maxWidthOrHeight?: number;
    prefix?: string;
  } = {}
): Promise<ProcessedImage> {
  const { maxWidthOrHeight = 1920, prefix = "" } = options;

  const compressionOptions = {
    maxSizeMB: 1.5,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.82,
  };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    const path = `${userId}/${prefix ? prefix + "/" : ""}${crypto.randomUUID()}.webp`;
    return { blob: compressedBlob, path, contentType: "image/webp" };
  } catch {
    const originalExtension = file.name.split(".").pop()?.toLowerCase();
    const extension = originalExtension && /^[a-z0-9]+$/.test(originalExtension) ? originalExtension : "jpg";
    const path = `${userId}/${prefix ? prefix + "/" : ""}${crypto.randomUUID()}.${extension}`;
    return { blob: file, path, contentType: file.type || "image/jpeg" };
  }
}
