import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getValidImageSrc } from '@/lib/imageHelper';

export default function Orders() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, pending, failed
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '10',
        offset: ((page - 1) * 10).toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/user/orders?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setSummary(data.summary);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        console.error('Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Orders fetch error:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchOrders();
      }
    }
  }, [user, authLoading, router, page, sortBy, sortOrder]);

  // View order details
  const viewOrderDetails = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  // Reorder functionality
  const reorderItems = async (orderId) => {
    try {
      // Get order details first
      const response = await fetch(`/api/user/orders/${orderId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const order = data.order;
        
        // Add all items from the order to cart
        const addPromises = order.items.map(item => 
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
              productId: item.productId, 
              quantity: item.quantity 
            })
          })
        );
        
        await Promise.all(addPromises);
        alert('Items added to cart successfully!');
        router.push('/cart');
      } else {
        alert('Failed to get order details');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      alert('Failed to reorder items');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.orderStatus === filter;
  });

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>My Orders - Trivedam</title>
          <meta name="description" content="View your order history and track deliveries" />
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Loading Orders...</h1>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - Trivedam</title>
        <meta name="description" content="View your order history and track deliveries" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Header */}
        <div className="bg-[#2F674A] text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">My Orders</h1>
            <p className="text-xl opacity-90">Track your orders and purchase history</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-[#2F674A]">{summary.totalOrders}</h3>
                  <p className="text-gray-600">Total Orders</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-green-600">{summary.confirmedOrders}</h3>
                  <p className="text-gray-600">Confirmed</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-yellow-600">{summary.pendingOrders}</h3>
                  <p className="text-gray-600">Pending</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-[#2F674A]">₹{summary.totalValue}</h3>
                  <p className="text-gray-600">Total Spent</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Sorting */}
          <Card className="bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filter === 'all' ? 'bg-[#2F674A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Orders ({orders.length})
                  </button>
                  <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Confirmed ({summary?.confirmedOrders || 0})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending ({summary?.pendingOrders || 0})
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="orderDate">Order Date</option>
                    <option value="orderAmount">Amount</option>
                    <option value="orderId">Order ID</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-6">📦</div>
                <h2 className="text-2xl font-bold mb-4 text-black">No Orders Found</h2>
                <p className="text-gray-600 mb-8">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet. Start shopping to see your orders here."
                    : `No ${filter} orders found. Try changing the filter.`
                  }
                </p>
                <ButtonDemo
                  label="Start Shopping"
                  bgColor="green"
                  onClick={() => router.push('/products')}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <Card key={order.orderId} className="bg-white hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.orderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                        <span className="text-xl font-bold text-[#2F674A]">₹{order.orderAmount}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Items ({order.totalItems})</h4>
                        <div className="space-y-3">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.orderDetailId} className="flex items-center gap-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={getValidImageSrc(item.productImage)}
                                  alt={item.productName}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm truncate">{item.productName}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">₹{item.lineTotal}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-600">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Details & Actions */}
                      <div>
                        <h4 className="font-semibold mb-3">Order Details</h4>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`font-medium ${
                              order.paymentStatus === 'paid' ? 'text-green-600' : 
                              order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Items:</span>
                            <span>{order.totalItems}</span>
                          </div>
                          {order.shippingAddress && (
                            <div className="pt-2 border-t">
                              <span className="text-gray-600">Delivery Address:</span>
                              <p className="text-sm mt-1">{order.shippingAddress}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <ButtonDemo
                            label="View Details"
                            bgColor="green"
                            onClick={() => viewOrderDetails(order.orderId)}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <ButtonDemo
                              label="Reorder"
                              bgColor="black"
                              onClick={() => reorderItems(order.orderId)}
                            />
                            <ButtonDemo
                              label="Track Order"
                              bgColor="white"
                              onClick={() => alert('Order tracking will be implemented soon')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination would go here if needed */}
          
          {/* Continue Shopping */}
          <div className="mt-12 text-center">
            <Card className="bg-[#F8F0E1] border-none">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-black">Continue Shopping</h3>
                <p className="text-gray-600 mb-6">Discover more amazing Ayurvedic products for your wellness journey</p>
                <ButtonDemo
                  label="Shop Now"
                  bgColor="green"
                  onClick={() => router.push('/products')}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}