const STATUS_STYLES = {
  Delivered:
    'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  Pending:
    'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  Canceled:
    'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
}

export function getRecentOrders() {
  return [
    {
      id: 'order-1',
      name: 'Macbook pro 13”',
      variants: '2 Variants',
      image: '/images/product/product-01.jpg',
      category: 'Laptop',
      price: '$2399.00',
      status: 'Delivered',
      statusClass: STATUS_STYLES.Delivered,
    },
    {
      id: 'order-2',
      name: 'Apple Watch Ultra',
      variants: '1 Variants',
      image: '/images/product/product-02.jpg',
      category: 'Watch',
      price: '$879.00',
      status: 'Pending',
      statusClass: STATUS_STYLES.Pending,
    },
    {
      id: 'order-3',
      name: 'iPhone 15 Pro Max',
      variants: '2 Variants',
      image: '/images/product/product-03.jpg',
      category: 'SmartPhone',
      price: '$1869.00',
      status: 'Delivered',
      statusClass: STATUS_STYLES.Delivered,
    },
    {
      id: 'order-4',
      name: 'iPad Pro 3rd Gen',
      variants: '2 Variants',
      image: '/images/product/product-04.jpg',
      category: 'Electronics',
      price: '$1699.00',
      status: 'Canceled',
      statusClass: STATUS_STYLES.Canceled,
    },
    {
      id: 'order-5',
      name: 'Airpods Pro 2nd Gen',
      variants: '1 Variants',
      image: '/images/product/product-05.jpg',
      category: 'Accessories',
      price: '$240.00',
      status: 'Delivered',
      statusClass:
        'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    },
  ]
}
