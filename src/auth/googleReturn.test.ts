import { describe, expect, it } from 'vitest'
import { readGoogleReturn } from './googleReturn'

describe('readGoogleReturn', () => {
  it('finds the code on the dashboard address Google sign-in returns to', () => {
    expect(readGoogleReturn({ pathname: '/dashboard', search: '?code=abc123' })).toBe('abc123')
  })
  it('ignores other pages, so reset-password links and others keep their own values', () => {
    expect(readGoogleReturn({ pathname: '/reset-password', search: '?code=abc' })).toBeNull()
    expect(readGoogleReturn({ pathname: '/login', search: '?code=abc' })).toBeNull()
  })
  it('ignores a dashboard visit without a code', () => {
    expect(readGoogleReturn({ pathname: '/dashboard', search: '' })).toBeNull()
    expect(readGoogleReturn({ pathname: '/dashboard', search: '?code=' })).toBeNull()
  })
})
