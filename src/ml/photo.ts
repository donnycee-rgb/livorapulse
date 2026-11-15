// Phone photos are 12-50 megapixels; decoding one at full size can take
// 100-200 MB of memory, on top of the food model. The model only needs
// 224x224, so photos are shrunk as soon as they're picked and the original
// is let go.

export const MAX_SIDE = 1024
const QUALITY = 0.85

/** Target size that fits within maxSide, never enlarging. */
export function fitWithin(width: number, height: number, maxSide = MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not shrink the photo'))), 'image/jpeg', QUALITY))
}

function draw(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(source, 0, 0, w, h)
  return canvas
}

/** A small JPEG copy of the photo (longest side at most MAX_SIDE). */
export async function shrinkPhoto(file: Blob, maxSide = MAX_SIDE): Promise<Blob> {
  // Fast path (Chrome, Android): the browser decodes straight to a smaller
  // size, so the full-size image never sits in memory.
  if (typeof createImageBitmap === 'function') {
    try {
      const probe = await createImageBitmap(file, { resizeWidth: maxSide, resizeQuality: 'medium' })
      // resizeWidth only sets the width; for tall photos, check the height too
      const { width, height } = fitWithin(probe.width, probe.height, maxSide)
      const canvas = draw(probe, width, height)
      probe.close()
      return await toJpeg(canvas)
    } catch {
      // fall through to the slower path
    }
  }
  // Fallback: decode in an <img>, then draw smaller
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxSide)
    return await toJpeg(draw(img, width, height))
  } finally {
    URL.revokeObjectURL(url)
  }
}
