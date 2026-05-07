import { describe, it, expect } from 'vitest'

describe('Basic Test Suite', () => {
  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should handle string operations', () => {
    const str = 'Femvelle'
    expect(str.toLowerCase()).toBe('femvelle')
    expect(str.length).toBe(8)
  })

  it('should work with arrays', () => {
    const items = [1, 2, 3]
    expect(items).toHaveLength(3)
    expect(items.includes(2)).toBe(true)
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    const result = await promise
    expect(result).toBe('success')
  })
})