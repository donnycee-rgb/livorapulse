// The app previews activity calories with its own copy of the activity table;
// the server works out the saved numbers. If the two tables ever differ, the
// preview would promise something the server doesn't save. Runs only where
// the backend sits next to the frontend (this repo layout).
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '../src/lib/activities'

const backend = join(dirname(fileURLToPath(import.meta.url)), '../../livoraPulse_Backend/src/utils/activities.ts')

describe.runIf(existsSync(backend))('activity table matches the server', () => {
  it('same activities with the same MET values', () => {
    const src = readFileSync(backend, 'utf8')
    const server = Object.fromEntries(
      [...src.matchAll(/^\s*(\w+):\s*\{\s*label:\s*'[^']*',\s*met:\s*([\d.]+)/gm)].map((m) => [m[1], Number(m[2])]),
    )
    const app = Object.fromEntries(Object.entries(ACTIVITIES).map(([k, v]) => [k, v.met]))
    expect(app).toEqual(server)
  })
})
