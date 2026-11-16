// ---------------------------------------------------------------------------
// On-device food photo classifier.
//
// Runs entirely in the browser with TensorFlow.js — photos never leave the
// phone and there is no per-scan cost. Expects a Google Teachable Machine
// "TensorFlow.js" export placed in public/models/kenyan-food/:
//   model.json, weights.bin, metadata.json  (metadata.labels = class names)
//
// TensorFlow.js (~1 MB gzipped) is loaded only the first time someone scans.
// ---------------------------------------------------------------------------
import type { LayersModel } from '@tensorflow/tfjs'
import { topK, type Prediction } from './portion'

const MODEL_DIR = '/models/kenyan-food'
const INPUT_SIZE = 224

type Tf = typeof import('@tensorflow/tfjs')

let loading: Promise<{ tf: Tf; model: LayersModel; labels: string[] }> | null = null

export class ModelUnavailableError extends Error {
  constructor() {
    super('The food photo model has not been added yet.')
  }
}

async function load() {
  const metaRes = await fetch(`${MODEL_DIR}/metadata.json`).catch(() => null)
  // Vite serves index.html for unknown paths, so check it is really JSON.
  const isJson = metaRes?.ok && (metaRes.headers.get('content-type') ?? '').includes('json')
  if (!isJson) throw new ModelUnavailableError()
  const meta = (await metaRes!.json()) as { labels?: string[] }
  if (!meta.labels?.length) throw new ModelUnavailableError()

  const tf = await import('@tensorflow/tfjs')
  await tf.ready()
  const model = await tf.loadLayersModel(`${MODEL_DIR}/model.json`)
  return { tf, model, labels: meta.labels }
}

/** Load the model once; later calls reuse it. A failed load can be retried. */
export function loadFoodModel() {
  if (!loading) {
    loading = load().catch((err) => {
      loading = null
      throw err
    })
  }
  return loading
}

/** Square centre crop scaled to the model input size (what Teachable Machine trains on). */
function cropToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2
  const canvas = document.createElement('canvas')
  canvas.width = INPUT_SIZE
  canvas.height = INPUT_SIZE
  canvas.getContext('2d')!.drawImage(img, sx, sy, side, side, 0, 0, INPUT_SIZE, INPUT_SIZE)
  return canvas
}

/** Top guesses for a food photo, most likely first. */
export async function classifyFood(img: HTMLImageElement, k = 3): Promise<Prediction[]> {
  const { tf, model, labels } = await loadFoodModel()
  const canvas = cropToCanvas(img)
  const probs = tf.tidy(() => {
    const pixels = tf.browser.fromPixels(canvas).toFloat()
    const input = pixels.div(127.5).sub(1).expandDims(0) // scale to [-1, 1]
    return (model.predict(input) as import('@tensorflow/tfjs').Tensor).dataSync()
  })
  return topK(labels, probs, k)
}
