import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbStructuredData } from './StructuredData';

interface BreadcrumbItem {
  name: string;
  path: string;
  isActive?: boolean;
}

interface SEOBreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const SEOBreadcrumbs: React.FC<SEOBreadcrumbsProps> = ({ 
  items, 
  className = '' 
}) => {
  const location = useLocation();

  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  // Generate structured data for breadcrumbs
  const structuredBreadcrumbs = breadcrumbItems.map(item => ({
    name: item.name,
    url: `https://femvelle.com${item.path}`,
  }));

  return (
    <>
      <BreadcrumbStructuredData breadcrumbs={structuredBreadcrumbs} />
      
      <nav 
        className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
          {breadcrumbItems.map((item, index) => (
            <li 
              key={item.path}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
              
              {item.isActive ? (
                <span 
                  className="text-[#2C2420] font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-[#C4985A] transition-colors duration-200"
                  itemProp="item"
                >
                  <span itemProp="name">
                    {index === 0 ? (
                      <div className="flex items-center space-x-1">
                        <Home className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    ) : (
                      item.name
                    )}
                  </span>
                </Link>
              )}
              
              <meta itemProp="position" content={(index + 1).toString()} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

// Auto-generate breadcrumbs from URL path
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', path: '/' }
  ];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Generate human-readable names
    let name = segment;
    
    // Handle specific routes
    switch (segment) {
      case 'products':
        name = 'Products';
        break;
      case 'categories':
        name = 'Categories';
        break;
      case 'blog':
        name = 'Blog';
        break;
      case 'about':
        name = 'About Us';
        break;
      case 'contact':
        name = 'Contact';
        break;
      case 'cart':
        name = 'Shopping Cart';
        break;
      case 'checkout':
        name = 'Checkout';
        break;
      case 'wishlist':
        name = 'Wishlist';
        break;
      case 'account':
        name = 'My Account';
        break;
      default:
        // Capitalize and replace hyphens with spaces
        name = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
    
    breadcrumbs.push({
      name,
      path: currentPath,
      isActive: isLast
    });
  });

  return breadcrumbs;
}

// Hook for easy breadcrumb management
export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  return { items };
};