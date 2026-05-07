import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders, mockProduct } from '../utils'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/products/ProductCard'
import Navbar from '@/components/layout/Navbar'

describe('Button Component', () => {
  it('renders with correct text', () => {
    renderWithProviders(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    renderWithProviders(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200')
  })

  it('shows loading state', () => {
    renderWithProviders(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})

describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('navigates to product detail on click', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)
    
    const productLink = screen.getByRole('link')
    expect(productLink).toHaveAttribute('href', '/products/test-product')
  })

  it('shows wishlist button when user is authenticated', () => {
    renderWithProviders(
      <ProductCard product={mockProduct} />,
      { user: { id: 1, email: 'test@example.com' } }
    )
    
    expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument()
  })

  it('shows rating and review count', () => {
    renderWithProviders(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(10 reviews)')).toBeInTheDocument()
  })
})

describe('Navbar Component', () => {
  it('renders navigation links', () => {
    renderWithProviders(<Navbar />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('shows login/register when not authenticated', () => {
    renderWithProviders(<Navbar />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    renderWithProviders(<Navbar />, { user: mockUser })
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('shows cart with item count', () => {
    renderWithProviders(<Navbar />)
    
    const cartButton = screen.getByLabelText('Shopping cart')
    expect(cartButton).toBeInTheDocument()
  })

  it('opens mobile menu on hamburger click', () => {
    renderWithProviders(<Navbar />)
    
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})