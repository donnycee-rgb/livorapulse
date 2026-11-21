import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

// A filled-in email once turned invisible on the light sign-in page: the
// autofill rule forced white text. Autofilled text must keep the field's own colour.
it('autofilled text keeps the colour of the field, never a fixed one', () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/styles/globals.css'), 'utf8')
  const rule = css.slice(css.indexOf('input:-webkit-autofill'), css.indexOf('}', css.indexOf('input:-webkit-autofill')))
  expect(rule).toMatch(/-webkit-text-fill-color:\s*currentColor/)
  expect(rule).not.toMatch(/text-fill-color:\s*(white|#fff)/i)
})
