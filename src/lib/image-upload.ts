const MAX_IMAGE_EDGE = 1920;
const WEBP_QUALITY = 0.82;

export type UploadImage = {
  file: File;
  extension: string;
  contentType: string;
};

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
}

export async function optimizeImageForUpload(file: File): Promise<UploadImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported image file");
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (file.type === "image/webp" && scale === 1) {
      bitmap.close();
      return { file, extension: "webp", contentType: "image/webp" };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      bitmap.close();
      throw new Error("Canvas is unavailable");
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await canvasToBlob(canvas);
    canvas.width = 1;
    canvas.height = 1;
    if (!blob || blob.type !== "image/webp") throw new Error("WebP is unavailable");

    const stem = file.name.replace(/\.[^.]+$/, "") || "property-photo";
    return {
      file: new File([blob], `${stem}.webp`, { type: "image/webp", lastModified: Date.now() }),
      extension: "webp",
      contentType: "image/webp",
    };
  } catch {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return { file, extension, contentType: file.type || "image/jpeg" };
  }
}