import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { SEOProvider } from '@/contexts/SEOContext'

// Mock user data
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_staff: false,
}

// Mock product data
export const mockProduct = {
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  price: '99.99',
  images: [
    {
      id: 1,
      image: '/test-image.jpg',
      alt_text: 'Test image',
      is_primary: true,
    }
  ],
  variants: [
    {
      id: 1,
      size: 'M',
      color: 'Black',
      sku: 'TEST-M-BLACK',
      stock_quantity: 10,
      price: '99.99',
    }
  ],
  category: {
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
  },
  average_rating: 4.5,
  review_count: 10,
}

// Mock cart item
export const mockCartItem = {
  id: 1,
  variant: mockProduct.variants[0],
  quantity: 2,
  product: mockProduct,
}

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  user?: typeof mockUser | null
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    user = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialUser={user}>
            <CartProvider>
              <SEOProvider>
                {children}
              </SEOProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Mock fetch
export const mockFetch = (response: any, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as any
}