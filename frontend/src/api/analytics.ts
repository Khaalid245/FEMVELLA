import { apiClient } from './client';

export interface AnalyticsEvent {
  event_type: string;
  session_id: string;
  page_url?: string;
  referrer?: string;
  product_id?: number;
  product_name?: string;
  product_price?: number;
  category_name?: string;
  metadata?: Record<string, any>;
}

export interface DashboardOverview {
  revenue: {
    daily_data: Array<{
      date: string;
      revenue: number;
      orders: number;
      aov: number;
      conversion_rate: number;
    }>;
    summary: {
      total_revenue: number;
      growth_rate: number;
      total_orders: number;
      average_order_value: number;
    };
  };
  top_products: Array<{
    product_id: number;
    name: string;
    category: string;
    revenue: number;
    units_sold: number;
    conversion_rate: number;
  }>;
  customer_segments: {
    segments: Array<{
      segment: string;
      count: number;
      percentage: number;
      revenue: number;
      avg_order_value: number;
    }>;
    total_customers: number;
  };
  conversion_funnel: {
    funnel_data: {
      visitors: number;
      product_views: number;
      add_to_cart: number;
      checkout_start: number;
      checkout_complete: number;
    };
    conversion_rates: {
      overall_conversion: number;
      visitor_to_view: number;
      view_to_cart: number;
      cart_to_checkout: number;
      checkout_to_purchase: number;
    };
  };
  abandoned_carts: {
    total_abandoned: number;
    recovery_rate: number;
    total_value: number;
    lost_revenue: number;
  };
}

export interface RealTimeMetrics {
  active_sessions: number;
  today_visitors: number;
  today_orders: number;
  today_revenue: number;
  current_cart_abandonment: number;
  top_pages_today: Array<{
    page_url: string;
    views: number;
  }>;
}

export interface RevenueAnalytics {
  daily_data: Array<{
    date: string;
    revenue: number;
    orders: number;
    aov: number;
    conversion_rate: number;
  }>;
  summary: {
    total_revenue: number;
    growth_rate: number;
    total_orders: number;
    average_order_value: number;
  };
  category_breakdown: Array<{
    category: string;
    revenue: number;
    units: number;
  }>;
  day_of_week_analysis: Array<{
    day: number;
    avg_revenue: number;
    avg_orders: number;
  }>;
}

export interface ProductAnalytics {
  top_products: Array<{
    product_id: number;
    name: string;
    category: string;
    revenue: number;
    units_sold: number;
    conversion_rate: number;
  }>;
  top_converting: Array<{
    product_id: number;
    name: string;
    conversion_rate: number;
    views: number;
    revenue: number;
  }>;
  low_converting: Array<{
    product_id: number;
    name: string;
    conversion_rate: number;
    views: number;
    revenue: number;
  }>;
}

export interface CustomerAnalytics {
  segments: Array<{
    segment: string;
    count: number;
    percentage: number;
    revenue: number;
    avg_order_value: number;
  }>;
  total_customers: number;
  ltv_distribution: Array<{
    ltv_range: string;
    count: number;
  }>;
  customer_trends: Array<{
    date: string;
    new_customers: number;
    returning_customers: number;
  }>;
  top_customers: Array<{
    user_id: number;
    email: string;
    total_spent: number;
    total_orders: number;
    avg_order_value: number;
    segment: string;
  }>;
}

export interface ConversionAnalytics {
  funnel_data: {
    visitors: number;
    product_views: number;
    add_to_cart: number;
    checkout_start: number;
    checkout_complete: number;
  };
  conversion_rates: {
    overall_conversion: number;
    visitor_to_view: number;
    view_to_cart: number;
    cart_to_checkout: number;
    checkout_to_purchase: number;
  };
  daily_trends: Array<{
    date: string;
    visitors: number;
    conversion_rate: number;
    product_views: number;
    add_to_cart: number;
    checkout_complete: number;
  }>;
}

export interface AbandonedCartAnalytics {
  summary: {
    total_abandoned: number;
    recovered_carts: number;
    recovery_rate: number;
    total_value: number;
    recovered_value: number;
    lost_revenue: number;
  };
  abandonment_analysis: Array<{
    time_spent_minutes: number;
    count: number;
  }>;
  recent_carts: Array<{
    id: number;
    user_email: string;
    total_value: number;
    item_count: number;
    abandoned_at: string;
    recovered: boolean;
    recovery_email_sent: boolean;
  }>;
  hourly_abandonment: Array<{
    hour: number;
    count: number;
    avg_value: number;
  }>;
  recovery_email_stats: {
    emails_sent: number;
    recovered_after_email: number;
    email_recovery_rate: number;
  };
}

export interface SearchAnalytics {
  top_searches: Array<{
    query: string;
    searches: number;
    avg_results: number;
    conversions: number;
    revenue: number;
  }>;
  zero_results: Array<{
    query: string;
    search_count: number;
  }>;
  summary: {
    total_searches: number;
    avg_conversion_rate: number;
    total_search_revenue: number;
  };
}

class AnalyticsAPI {
  // Event tracking
  async trackEvent(event: AnalyticsEvent): Promise<{ success: boolean; event_id: string }> {
    const response = await apiClient.post('/analytics/track/', event);
    return response.data;
  }

  // Dashboard data
  async getDashboardOverview(days: number = 30): Promise<DashboardOverview> {
    const response = await apiClient.get(`/analytics/dashboard/?days=${days}`);
    return response.data;
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const response = await apiClient.get('/analytics/realtime/');
    return response.data;
  }

  // Detailed analytics
  async getRevenueAnalytics(days: number = 30): Promise<RevenueAnalytics> {
    const response = await apiClient.get(`/analytics/revenue/?days=${days}`);
    return response.data;
  }

  async getProductAnalytics(days: number = 30, limit: number = 20): Promise<ProductAnalytics> {
    const response = await apiClient.get(`/analytics/products/?days=${days}&limit=${limit}`);
    return response.data;
  }

  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    const response = await apiClient.get('/analytics/customers/');
    return response.data;
  }

  async getConversionAnalytics(days: number = 30): Promise<ConversionAnalytics> {
    const response = await apiClient.get(`/analytics/conversion/?days=${days}`);
    return response.data;
  }

  async getAbandonedCartAnalytics(days: number = 30): Promise<AbandonedCartAnalytics> {
    const response = await apiClient.get(`/analytics/abandoned-carts/?days=${days}`);
    return response.data;
  }

  async getSearchAnalytics(days: number = 30): Promise<SearchAnalytics> {
    const response = await apiClient.get(`/analytics/search/?days=${days}`);
    return response.data;
  }
}

export const analyticsApi = new AnalyticsAPI();

// Analytics tracking utilities
export class AnalyticsTracker {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  async trackPageView(pageUrl: string, referrer?: string): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'page_view',
        session_id: this.sessionId,
        page_url: pageUrl,
        referrer: referrer || document.referrer,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  async trackProductView(productId: number, productName: string, productPrice: number, categoryName: string): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'product_view',
        session_id: this.sessionId,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        category_name: categoryName,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }

  async trackAddToCart(productId: number, productName: string, productPrice: number, categoryName: string): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'add_to_cart',
        session_id: this.sessionId,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        category_name: categoryName,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }

  async trackRemoveFromCart(productId: number, productName: string): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'remove_from_cart',
        session_id: this.sessionId,
        product_id: productId,
        product_name: productName,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track remove from cart:', error);
    }
  }

  async trackCheckoutStart(): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'checkout_start',
        session_id: this.sessionId,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track checkout start:', error);
    }
  }

  async trackCheckoutComplete(orderId?: number): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'checkout_complete',
        session_id: this.sessionId,
        page_url: window.location.href,
        metadata: orderId ? { order_id: orderId } : {},
      });
    } catch (error) {
      console.error('Failed to track checkout complete:', error);
    }
  }

  async trackSearch(query: string, resultsCount: number): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'search',
        session_id: this.sessionId,
        page_url: window.location.href,
        metadata: {
          query,
          results_count: resultsCount,
        },
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  async trackWishlistAdd(productId: number, productName: string): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'wishlist_add',
        session_id: this.sessionId,
        product_id: productId,
        product_name: productName,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track wishlist add:', error);
    }
  }

  async trackUserRegistration(): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'user_registration',
        session_id: this.sessionId,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track user registration:', error);
    }
  }

  async trackUserLogin(): Promise<void> {
    try {
      await analyticsApi.trackEvent({
        event_type: 'user_login',
        session_id: this.sessionId,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Failed to track user login:', error);
    }
  }
}

// Global analytics tracker instance
export const analyticsTracker = new AnalyticsTracker();