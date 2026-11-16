// The app shows habits and trip CO₂ from its own copy of the lists in
// src/lib/green.ts; the server saves the numbers from its copy. They must
// match, or the app would promise something the server doesn't save.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HABITS, TRIP_MODES } from '../src/lib/green'

const backend = join(dirname(fileURLToPath(import.meta.url)), '../../livoraPulse_Backend/src/utils/green.ts')

describe.runIf(existsSync(backend))('green habits and trips match the server', () => {
  const src = existsSync(backend) ? readFileSync(backend, 'utf8') : ''

  it('same habits', () => {
    const block = src.slice(src.indexOf('export const HABITS'), src.indexOf('} as const', src.indexOf('export const HABITS')))
    const server = Object.fromEntries([...block.matchAll(/^\s*(\w+):\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]))
    expect(HABITS).toEqual(server)
  })

  it('same trip modes and emission factors', () => {
    const server = Object.fromEntries(
      [...src.matchAll(/^\s*(\w+):\s*\{\s*label:\s*'([^']+)',\s*kgPerKm:\s*([\d.]+)\s*\}/gm)].map((m) => [m[1], { label: m[2], kgPerKm: Number(m[3]) }]),
    )
    expect(TRIP_MODES).toEqual(server)
  })
})
