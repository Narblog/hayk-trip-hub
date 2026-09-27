import imageCompression from "browser-image-compression";

export interface ProcessedImage {
  blob: Blob;
  path: string;
}

export async function processImage(
  file: File,
  userId: string,
  options: {
    maxWidthOrHeight?: number;
    prefix?: string;
  } = {}
): Promise<ProcessedImage> {
  const { maxWidthOrHeight = 1200, prefix = "" } = options;

  const compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    const path = `${userId}/${prefix ? prefix + "/" : ""}${crypto.randomUUID()}.webp`;
    return { blob: compressedBlob, path };
  } catch (error) {
    console.error("Error compressing image:", error);
    // Fallback to original file if compression fails, but still use .webp extension if possible
    // or just return the original if it's really bad
    const path = `${userId}/${prefix ? prefix + "/" : ""}${crypto.randomUUID()}.webp`;
    return { blob: file, path };
  }
}
