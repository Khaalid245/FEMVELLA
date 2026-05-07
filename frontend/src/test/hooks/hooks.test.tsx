import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useProducts, useProduct } from '@/hooks/useProducts'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { mockProduct, mockUser, mockFetch } from '../utils'

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useProducts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches products successfully', async () => {
    mockFetch({ results: [mockProduct], count: 1 })
    
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data?.results).toHaveLength(1)
    expect(result.current.data?.results[0].name).toBe('Test Product')
  })

  it('handles search and filters', async () => {
    mockFetch({ results: [], count: 0 })
    
    const { result } = renderHook(
      () => useProducts({ search: 'test', category: 'clothing' }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=test'),
      expect.any(Object)
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('category=clothing'),
      expect.any(Object)
    )
  })

  it('handles pagination', async () => {
    mockFetch({ results: [mockProduct], count: 20 })
    
    const { result } = renderHook(
      () => useProducts({ page: 2 }),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2'),
      expect.any(Object)
    )
  })
})

describe('useProduct Hook', () => {
  it('fetches single product by slug', async () => {
    mockFetch(mockProduct)
    
    const { result } = renderHook(
      () => useProduct('test-product'),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data?.name).toBe('Test Product')
    expect(result.current.data?.slug).toBe('test-product')
  })

  it('handles product not found', async () => {
    mockFetch({ detail: 'Not found' }, false)
    
    const { result } = renderHook(
      () => useProduct('non-existent'),
      { wrapper: createWrapper() }
    )
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('logs in user successfully', async () => {
    mockFetch({
      access: 'access_token',
      refresh: 'refresh_token',
      user: mockUser
    })
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('access_token')).toBe('access_token')
  })

  it('handles login failure', async () => {
    mockFetch({ detail: 'Invalid credentials' }, false)
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong_password')
      } catch (error) {
        expect(error.message).toBe('Invalid credentials')
      }
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('registers user successfully', async () => {
    mockFetch({
      access: 'access_token',
      refresh: 'refresh_token',
      user: mockUser
    })
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        password: 'password',
        first_name: 'Test',
        last_name: 'User'
      })
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logs out user', async () => {
    localStorage.setItem('access_token', 'token')
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })
    
    act(() => {
      result.current.logout()
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})

describe('useCart Hook', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem({
        variant: mockProduct.variants[0],
        quantity: 2,
        product: mockProduct
      })
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.totalItems).toBe(2)
  })

  it('updates item quantity', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem({
        variant: mockProduct.variants[0],
        quantity: 1,
        product: mockProduct
      })
    })
    
    act(() => {
      result.current.updateQuantity(mockProduct.variants[0].id, 3)
    })
    
    expect(result.current.items[0].quantity).toBe(3)
    expect(result.current.totalItems).toBe(3)
  })

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem({
        variant: mockProduct.variants[0],
        quantity: 1,
        product: mockProduct
      })
    })
    
    act(() => {
      result.current.removeItem(mockProduct.variants[0].id)
    })
    
    expect(result.current.items).toHaveLength(0)
    expect(result.current.totalItems).toBe(0)
  })

  it('calculates total price correctly', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem({
        variant: mockProduct.variants[0],
        quantity: 2,
        product: mockProduct
      })
    })
    
    expect(result.current.totalPrice).toBe(199.98) // 2 * 99.99
  })

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem({
        variant: mockProduct.variants[0],
        quantity: 1,
        product: mockProduct
      })
    })
    
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    expect(savedCart).toHaveLength(1)
    expect(savedCart[0].quantity).toBe(1)
  })
})