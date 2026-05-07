# Analytics & Business Intelligence System

## 📊 Overview

Comprehensive analytics and business intelligence dashboard for Femvelle providing real-time insights into:

- **Revenue Trends**: Daily, weekly, monthly revenue tracking with growth analysis
- **Product Performance**: Top-selling products, conversion rates, category analysis
- **Customer Analytics**: Segmentation, lifetime value, behavior patterns
- **Conversion Tracking**: Funnel analysis, drop-off points, optimization opportunities
- **Abandoned Carts**: Recovery tracking, email campaigns, lost revenue analysis
- **Search Analytics**: Query performance, zero-result searches, conversion tracking

## 🏗️ Architecture

### Backend Components

```
Analytics System
├── Models (apps/analytics/models.py)
│   ├── AnalyticsEvent - Event tracking
│   ├── RevenueMetrics - Daily revenue data
│   ├── ProductAnalytics - Product performance
│   ├── CustomerAnalytics - Customer segmentation
│   ├── ConversionFunnel - Funnel analysis
│   ├── AbandonedCart - Cart abandonment tracking
│   └── SearchAnalytics - Search behavior
├── Services (apps/analytics/services.py)
│   └── AnalyticsService - Business logic
├── Views (apps/analytics/views.py)
│   └── API endpoints for dashboard data
├── Tasks (apps/analytics/tasks.py)
│   └── Celery tasks for data processing
└── URLs (apps/analytics/urls.py)
    └── API routing
```

### Frontend Components

```
Analytics Dashboard
├── AnalyticsDashboard.tsx - Main dashboard
├── RevenueAnalytics.tsx - Revenue deep dive
├── API (api/analytics.ts)
│   ├── Analytics API client
│   └── Event tracking utilities
├── Hooks (hooks/useAnalytics.ts)
│   └── Analytics tracking hooks
└── Pages (pages/admin/AnalyticsPage.tsx)
    └── Admin analytics interface
```

## 📈 Key Features

### Real-Time Metrics
- **Active Sessions**: Current users on site
- **Today's Visitors**: Unique visitors today
- **Today's Orders**: Orders placed today
- **Today's Revenue**: Revenue generated today
- **Cart Abandonment**: Real-time abandonment tracking

### Revenue Analytics
- **Daily Revenue Trends**: Line charts with growth indicators
- **Category Breakdown**: Revenue distribution by product category
- **Day of Week Analysis**: Performance patterns by weekday
- **Average Order Value**: AOV trends and optimization
- **Growth Rate Calculation**: Period-over-period comparison

### Product Performance
- **Top Products**: Best performers by revenue and units
- **Conversion Rates**: Product-specific conversion tracking
- **Category Analysis**: Performance by product category
- **View-to-Purchase**: Conversion funnel for products
- **Low Performers**: Products needing optimization

### Customer Segmentation
- **New Customers**: First-time buyers
- **Active Customers**: Regular purchasers
- **At Risk**: Customers showing churn signals
- **Churned**: Inactive customers
- **VIP Customers**: High-value customers
- **Lifetime Value**: Customer value distribution

### Conversion Funnel
- **Visitor Journey**: Complete funnel visualization
- **Drop-off Analysis**: Identify optimization points
- **Conversion Rates**: Stage-by-stage performance
- **Trend Analysis**: Funnel performance over time

### Abandoned Cart Recovery
- **Abandonment Tracking**: Real-time cart abandonment
- **Recovery Campaigns**: Automated email sequences
- **Recovery Rate**: Success metrics for campaigns
- **Lost Revenue**: Potential revenue recovery
- **Timing Analysis**: Optimal recovery timing

## 🔧 Implementation

### Event Tracking

```typescript
// Automatic page tracking
usePageTracking(); // Tracks all page views

// Product interactions
const { trackProductView, trackAddToCart } = useProductTracking();

// Track product view
await trackProductView(productId, name, price, category);

// Track add to cart
await trackAddToCart(productId, name, price, category);

// Checkout tracking
const { trackCheckoutStart, trackCheckoutComplete } = useCheckoutTracking();

await trackCheckoutStart();
await trackCheckoutComplete(orderId);
```

### API Usage

```typescript
// Get dashboard overview
const dashboardData = await analyticsApi.getDashboardOverview(30);

// Get revenue analytics
const revenueData = await analyticsApi.getRevenueAnalytics(30);

// Get real-time metrics
const realTimeMetrics = await analyticsApi.getRealTimeMetrics();
```

### Backend Processing

```python
# Update daily metrics
analytics_service = AnalyticsService()
analytics_service.update_daily_metrics()

# Get revenue trends
revenue_data = analytics_service.get_revenue_trends(days=30)

# Process abandoned carts
abandoned_data = analytics_service.get_abandoned_carts(days=30)
```

## 📊 Dashboard Features

### Main Dashboard
- **Key Metrics Cards**: Revenue, orders, AOV, conversion rate
- **Revenue Trend Chart**: Daily revenue with growth indicators
- **Conversion Funnel**: Visual funnel with drop-off rates
- **Customer Segments**: Pie chart of customer distribution
- **Top Products**: Best performers with metrics
- **Abandoned Carts**: Summary with recovery rates

### Revenue Analytics
- **Detailed Revenue Charts**: Multiple chart types and views
- **Category Performance**: Revenue breakdown by category
- **Day of Week Analysis**: Performance patterns
- **AOV Trends**: Average order value tracking
- **Growth Analysis**: Period comparisons

### Real-Time Monitoring
- **Live Metrics**: Updated every 30 seconds
- **Active Sessions**: Current site activity
- **Today's Performance**: Current day metrics
- **Top Pages**: Most visited pages today

## 🤖 Automated Tasks

### Daily Processing (1 AM)
```python
@shared_task
def update_daily_analytics():
    # Update revenue metrics
    # Update product analytics
    # Update conversion funnel
    # Update customer analytics
```

### Abandoned Cart Processing (Every 2 hours)
```python
@shared_task
def process_abandoned_carts():
    # Identify abandoned sessions
    # Create abandonment records
    # Calculate cart values
```

### Recovery Email Campaigns (Every 4 hours)
```python
@shared_task
def send_cart_recovery_emails():
    # Send recovery emails
    # Track email performance
    # Update recovery status
```

### Weekly Reporting (Mondays 9 AM)
```python
@shared_task
def generate_weekly_report():
    # Generate analytics summary
    # Send to admin users
    # Include key insights
```

## 📱 Mobile Optimization

- **Responsive Charts**: Mobile-friendly visualizations
- **Touch Interactions**: Optimized for mobile devices
- **Simplified Views**: Key metrics prioritized on mobile
- **Fast Loading**: Optimized data loading for mobile

## 🔒 Security & Privacy

- **Admin Only**: Analytics restricted to admin users
- **Data Anonymization**: Personal data protection
- **Session Tracking**: Anonymous session identification
- **GDPR Compliance**: Privacy-compliant tracking

## 📈 Performance Optimization

- **Data Aggregation**: Pre-calculated daily metrics
- **Caching**: Redis caching for frequent queries
- **Pagination**: Large datasets paginated
- **Background Processing**: Heavy calculations in Celery tasks
- **Database Indexing**: Optimized queries with proper indexes

## 🎯 Business Value

### Revenue Optimization
- **Growth Tracking**: Monitor revenue trends and growth
- **Category Performance**: Identify top-performing categories
- **Pricing Insights**: AOV analysis for pricing optimization

### Customer Insights
- **Segmentation**: Targeted marketing campaigns
- **Lifetime Value**: Customer value optimization
- **Churn Prevention**: At-risk customer identification

### Conversion Optimization
- **Funnel Analysis**: Identify drop-off points
- **A/B Testing**: Data-driven optimization
- **User Experience**: Improve conversion rates

### Operational Efficiency
- **Automated Reporting**: Reduce manual analysis
- **Real-Time Monitoring**: Immediate issue detection
- **Data-Driven Decisions**: Evidence-based business decisions

## 🚀 Future Enhancements

- **Predictive Analytics**: ML-powered forecasting
- **Cohort Analysis**: Customer behavior over time
- **Attribution Modeling**: Marketing channel effectiveness
- **Advanced Segmentation**: AI-powered customer clustering
- **Recommendation Engine**: Product recommendation analytics
- **Inventory Optimization**: Demand forecasting

## 📊 Metrics Tracked

### Revenue Metrics
- Total Revenue, Growth Rate, Orders, AOV
- Category Revenue, Daily Trends, Seasonal Patterns

### Product Metrics
- Views, Conversions, Revenue per Product
- Category Performance, Inventory Turnover

### Customer Metrics
- New vs Returning, Lifetime Value, Segments
- Churn Rate, Engagement Metrics

### Conversion Metrics
- Funnel Stages, Drop-off Rates, Optimization Opportunities
- A/B Test Results, User Journey Analysis

### Operational Metrics
- Cart Abandonment, Recovery Rates, Email Performance
- Search Performance, Site Performance Impact