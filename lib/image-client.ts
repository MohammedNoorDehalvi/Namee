export async function compressImageFile(
  file: File,
  options: { maxDimension?: number; maxSizeBytes?: number; quality?: number } = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? 900;
  const maxSizeBytes = options.maxSizeBytes ?? 900 * 1024;
  const quality = options.quality ?? 0.78;

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file only.');
  }

  if (file.type === 'image/gif' && file.size <= maxSizeBytes) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read this image. Try another photo.'));
      img.src = imageUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    if (!blob) return file;

    if (blob.size > file.size && file.size <= maxSizeBytes) return file;

    const safeName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${safeName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function fileSizeLabel(bytes: number) {
  if (!Number.isFinite(bytes)) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
