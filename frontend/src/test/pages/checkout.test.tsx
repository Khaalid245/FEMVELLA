import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockProduct, mockCartItem, mockFetch } from '../utils'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import { useCartStore } from '@/store/cartStore'

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
      })),
    })),
    confirmPayment: vi.fn(() => Promise.resolve({ error: null })),
  })),
}))

describe('Cart Page', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('shows empty cart message when no items', () => {
    renderWithProviders(<CartPage />)
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument()
  })

  it('displays cart items correctly', () => {
    useCartStore.getState().addItem(mockCartItem)
    renderWithProviders(<CartPage />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Size: M')).toBeInTheDocument()
    expect(screen.getByText('Color: Black')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('updates quantity correctly', async () => {
    useCartStore.getState().addItem(mockCartItem)
    renderWithProviders(<CartPage />)
    
    const quantityInput = screen.getByDisplayValue('2')
    fireEvent.change(quantityInput, { target: { value: '3' } })
    
    await waitFor(() => {
      expect(useCartStore.getState().items[0].quantity).toBe(3)
    })
  })

  it('removes item from cart', async () => {
    useCartStore.getState().addItem(mockCartItem)
    renderWithProviders(<CartPage />)
    
    const removeButton = screen.getByLabelText('Remove item')
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  it('calculates total correctly', () => {
    useCartStore.getState().addItem(mockCartItem)
    renderWithProviders(<CartPage />)
    
    expect(screen.getByText('$199.98')).toBeInTheDocument() // 2 * 99.99
  })

  it('navigates to checkout', () => {
    useCartStore.getState().addItem(mockCartItem)
    renderWithProviders(<CartPage />)
    
    const checkoutButton = screen.getByText('Proceed to Checkout')
    expect(checkoutButton).toHaveAttribute('href', '/checkout')
  })
})

describe('Checkout Flow', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
    useCartStore.getState().addItem(mockCartItem)
  })

  it('renders checkout form correctly', () => {
    renderWithProviders(<CheckoutPage />, { user: mockUser })
    
    expect(screen.getByText('Shipping Information')).toBeInTheDocument()
    expect(screen.getByText('Payment Method')).toBeInTheDocument()
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
  })

  it('validates required shipping fields', async () => {
    renderWithProviders(<CheckoutPage />, { user: mockUser })
    
    const submitButton = screen.getByText('Place Order')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument()
      expect(screen.getByText('Address is required')).toBeInTheDocument()
    })
  })

  it('calculates shipping costs', async () => {
    mockFetch({
      methods: [
        {
          id: 1,
          name: 'Standard Shipping',
          price: '9.99',
          estimated_days: '3-5'
        }
      ]
    })

    renderWithProviders(<CheckoutPage />, { user: mockUser })
    
    // Fill address to trigger shipping calculation
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'US' } })
    
    await waitFor(() => {
      expect(screen.getByText('Standard Shipping')).toBeInTheDocument()
      expect(screen.getByText('$9.99')).toBeInTheDocument()
    })
  })

  it('processes payment successfully', async () => {
    mockFetch({ success: true, order_id: '12345' })
    
    renderWithProviders(<CheckoutPage />, { user: mockUser })
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Test St' } })
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Test City' } })
    fireEvent.change(screen.getByLabelText('Postal Code'), { target: { value: '12345' } })
    
    const submitButton = screen.getByText('Place Order')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Processing payment...')).toBeInTheDocument()
    })
  })

  it('handles payment errors', async () => {
    mockFetch({ error: 'Payment failed' }, false)
    
    renderWithProviders(<CheckoutPage />, { user: mockUser })
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
    fireEvent.click(screen.getByText('Place Order'))
    
    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument()
    })
  })

  it('redirects unauthenticated users to login', () => {
    renderWithProviders(<CheckoutPage />)
    
    expect(screen.getByText('Please log in to continue')).toBeInTheDocument()
    expect(screen.getByText('Login')).toHaveAttribute('href', '/login')
  })
})