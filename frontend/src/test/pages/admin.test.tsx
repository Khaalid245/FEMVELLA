import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockProduct, mockFetch } from '../utils'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import ProductManagement from '@/pages/admin/ProductManagement'
import OrderManagement from '@/pages/admin/OrderManagement'

const mockAdminUser = {
  id: 1,
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  is_staff: true,
}

describe('Admin Dashboard', () => {
  it('redirects non-admin users', () => {
    renderWithProviders(<AdminDashboard />, { user: { ...mockAdminUser, is_staff: false } })
    
    expect(screen.getByText('Access denied')).toBeInTheDocument()
  })

  it('shows dashboard metrics for admin users', async () => {
    mockFetch({
      total_orders: 150,
      total_revenue: '15000.00',
      total_products: 45,
      pending_orders: 12
    })

    renderWithProviders(<AdminDashboard />, { user: mockAdminUser })
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // Total orders
      expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Revenue
      expect(screen.getByText('45')).toBeInTheDocument() // Products
      expect(screen.getByText('12')).toBeInTheDocument() // Pending orders
    })
  })

  it('displays recent orders', async () => {
    mockFetch({
      results: [
        {
          id: 1,
          order_number: 'ORD-001',
          user: { first_name: 'John', last_name: 'Doe' },
          total_amount: '99.99',
          status: 'pending',
          created_at: '2024-01-15T10:00:00Z'
        }
      ]
    })

    renderWithProviders(<AdminDashboard />, { user: mockAdminUser })
    
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('$99.99')).toBeInTheDocument()
    })
  })
})

describe('Product Management', () => {
  beforeEach(() => {
    mockFetch({ results: [mockProduct] })
  })

  it('displays product list', async () => {
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('$99.99')).toBeInTheDocument()
      expect(screen.getByText('Test Category')).toBeInTheDocument()
    })
  })

  it('opens product creation modal', () => {
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    const addButton = screen.getByText('Add Product')
    fireEvent.click(addButton)
    
    expect(screen.getByText('Create New Product')).toBeInTheDocument()
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
  })

  it('validates product form', async () => {
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    fireEvent.click(screen.getByText('Add Product'))
    fireEvent.click(screen.getByText('Save Product'))
    
    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument()
      expect(screen.getByText('Price is required')).toBeInTheDocument()
    })
  })

  it('creates new product successfully', async () => {
    mockFetch({ id: 2, name: 'New Product' })
    
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    fireEvent.click(screen.getByText('Add Product'))
    
    fireEvent.change(screen.getByLabelText('Product Name'), { 
      target: { value: 'New Product' } 
    })
    fireEvent.change(screen.getByLabelText('Price'), { 
      target: { value: '149.99' } 
    })
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'New product description' } 
    })
    
    fireEvent.click(screen.getByText('Save Product'))
    
    await waitFor(() => {
      expect(screen.getByText('Product created successfully')).toBeInTheDocument()
    })
  })

  it('edits existing product', async () => {
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      const editButton = screen.getByLabelText('Edit Test Product')
      fireEvent.click(editButton)
    })
    
    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument()
    expect(screen.getByDisplayValue('99.99')).toBeInTheDocument()
  })

  it('deletes product with confirmation', async () => {
    mockFetch({ success: true })
    
    renderWithProviders(<ProductManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      const deleteButton = screen.getByLabelText('Delete Test Product')
      fireEvent.click(deleteButton)
    })
    
    expect(screen.getByText('Are you sure you want to delete this product?')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Delete'))
    
    await waitFor(() => {
      expect(screen.getByText('Product deleted successfully')).toBeInTheDocument()
    })
  })
})

describe('Order Management', () => {
  const mockOrders = [
    {
      id: 1,
      order_number: 'ORD-001',
      user: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      total_amount: '199.98',
      status: 'pending',
      created_at: '2024-01-15T10:00:00Z',
      items: [
        {
          id: 1,
          product_name: 'Test Product',
          variant_details: 'Size: M, Color: Black',
          quantity: 2,
          price: '99.99'
        }
      ]
    }
  ]

  beforeEach(() => {
    mockFetch({ results: mockOrders })
  })

  it('displays order list', async () => {
    renderWithProviders(<OrderManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('$199.98')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  it('filters orders by status', async () => {
    renderWithProviders(<OrderManagement />, { user: mockAdminUser })
    
    const statusFilter = screen.getByLabelText('Filter by status')
    fireEvent.change(statusFilter, { target: { value: 'confirmed' } })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=confirmed'),
        expect.any(Object)
      )
    })
  })

  it('updates order status', async () => {
    mockFetch({ success: true })
    
    renderWithProviders(<OrderManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('pending')
      fireEvent.change(statusSelect, { target: { value: 'confirmed' } })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Order status updated')).toBeInTheDocument()
    })
  })

  it('views order details', async () => {
    renderWithProviders(<OrderManagement />, { user: mockAdminUser })
    
    await waitFor(() => {
      const viewButton = screen.getByLabelText('View order details')
      fireEvent.click(viewButton)
    })
    
    expect(screen.getByText('Order Details')).toBeInTheDocument()
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Size: M, Color: Black')).toBeInTheDocument()
  })
})