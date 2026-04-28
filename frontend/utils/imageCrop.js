const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('Could not prepare cropped image'));
    }, type, quality);
  });

export const cropImageFile = async (
  file,
  {
    zoom = 1,
    offsetX = 0,
    offsetY = 0,
    aspect = 1,
    fit = 'cover',
    outputWidth = 1200,
    outputType = file.type || 'image/jpeg',
    quality = 0.92,
    fileName,
  } = {}
) => {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const outputHeight = Math.round(outputWidth / safeAspect);
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const shouldContain = fit === 'contain';
    const baseScale = shouldContain
      ? Math.min(outputWidth / image.width, outputHeight / image.height)
      : Math.max(outputWidth / image.width, outputHeight / image.height);
    const scale = baseScale * clamp(zoom, 1, 4);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const travelX = Math.abs(scaledWidth - outputWidth) / 2;
    const travelY = Math.abs(scaledHeight - outputHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available');
    }

    context.drawImage(
      image,
      (outputWidth - scaledWidth) / 2 + (clamp(offsetX, -100, 100) / 100) * travelX,
      (outputHeight - scaledHeight) / 2 + (clamp(offsetY, -100, 100) / 100) * travelY,
      scaledWidth,
      scaledHeight
    );

    const blob = await canvasToBlob(canvas, outputType, quality);
    return new File([blob], fileName || file.name, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};
