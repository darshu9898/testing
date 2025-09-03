// src/pages/order-confirmation.jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonDemo } from '@/components/Button';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, paymentId, payment } = router.query;
  const { user, isAuthenticated } = useAuth();
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, isAuthenticated]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/user/orders?orderId=${orderId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.orders && data.orders.length > 0) {
          setOrderDetails(data.orders[0]);
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  const handleViewOrders = () => {
    router.push('/orders');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Order Confirmation - Trivedam</title>
          <meta name="description" content="Your order has been confirmed" />
        </Head>
        
        <div className="pt-16 min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Loading Order Details...</h1>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Order Error - Trivedam</title>
          <meta name="description" content="Error loading order details" />
        </Head>
        
        <div className="pt-16 min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <Card className="bg-white">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-6">❌</div>
                <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Order</h1>
                <p className="text-gray-600 mb-8">{error}</p>
                <div className="space-y-4">
                  <ButtonDemo
                    label="View All Orders"
                    bgColor="green"
                    onClick={handleViewOrders}
                  />
                  <div>
                    <ButtonDemo
                      label="Continue Shopping"
                      bgColor="black"
                      onClick={handleContinueShopping}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const paymentMethod = payment === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  const isOnlinePayment = payment !== 'cod';

  return (
    <>
      <Head>
        <title>Order Confirmed - Trivedam</title>
        <meta name="description" content="Your order has been successfully placed" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="text-8xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-xl mb-6">
              Thank you for choosing Trivedam. Your order has been successfully placed.
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-6 inline-block">
              <p className="text-lg font-medium">Order ID: #{orderId}</p>
              {paymentId && (
                <p className="text-sm mt-1">Payment ID: {paymentId}</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Order Details */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-black flex items-center gap-2">
                  <span>📦</span> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium text-black">#{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-medium text-black">
                      {orderDetails ? new Date(orderDetails.orderDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : new Date().toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-black">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                      orderDetails?.paymentStatus === 'paid' || payment === 'cod'
                        ? 'bg-green-100 text-green-800'
                        : orderDetails?.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {orderDetails?.paymentStatus === 'paid' ? 'Paid' : 
                       payment === 'cod' ? 'COD' : 
                       orderDetails?.paymentStatus || 'Processing'}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-black border-t pt-3">
                    <span>Total Amount</span>
                    <span className="text-[#2F674A]">
                      ₹{orderDetails ? orderDetails.orderAmount : '---'}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                {orderDetails && orderDetails.items && (
                  <div className="border-t pt-4">
                    <h4 className="font-bold text-black mb-3">Items Ordered ({orderDetails.totalItems})</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {orderDetails.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <img
                              src={item.productImage || '/product.png'}
                              alt={item.productName}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-grow">
                            <h5 className="font-medium text-black text-sm">{item.productName}</h5>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#2F674A] text-sm">₹{item.lineTotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery & Next Steps */}
            <div className="space-y-6">
              
              {/* Delivery Information */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-black flex items-center gap-2">
                    <span>🚚</span> Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-black mb-2">Estimated Delivery</h4>
                    <p className="text-2xl font-bold text-[#2F674A]">
                      {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">5-7 business days</p>
                  </div>
                  
                  {orderDetails?.shippingAddress && (
                    <div>
                      <h4 className="font-medium text-black mb-2">Delivery Address</h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                        {orderDetails.shippingAddress}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Track Your Order</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      You will receive tracking information via email and SMS once your order is shipped.
                    </p>
                    <ButtonDemo
                      label="Track Order"
                      bgColor="green"
                      onClick={() => router.push(`/track-order?id=${orderId}`)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* What's Next */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-black flex items-center gap-2">
                    <span>✨</span> What's Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-black">Order Confirmation</h4>
                        <p className="text-sm text-gray-600">
                          You'll receive an email confirmation shortly with your order details.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-black">Order Processing</h4>
                        <p className="text-sm text-gray-600">
                          Our team will prepare your natural Ayurvedic products with care.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-black">Shipped & Delivered</h4>
                        <p className="text-sm text-gray-600">
                          Your order will be shipped and delivered within 5-7 business days.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <ButtonDemo
                      label="View All Orders"
                      bgColor="green"
                      onClick={handleViewOrders}
                    />
                    <ButtonDemo
                      label="Continue Shopping"
                      bgColor="black"
                      onClick={handleContinueShopping}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Support */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Have questions about your order? We're here to help!
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl mb-1">📞</div>
                        <p className="text-xs font-medium text-black">Call Us</p>
                        <p className="text-xs text-blue-600">+91 98765 43210</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl mb-1">📧</div>
                        <p className="text-xs font-medium text-black">Email</p>
                        <p className="text-xs text-green-600">help@trivedam.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Thank You for Choosing Trivedam! 🙏
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Your trust in our natural Ayurvedic products means everything to us. 
                  We're committed to delivering the highest quality products to support your wellness journey.
                </p>
                <div className="flex justify-center space-x-8 text-center">
                  <div>
                    <div className="text-2xl mb-1">🌿</div>
                    <p className="text-sm font-medium text-gray-800">100% Natural</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">🚚</div>
                    <p className="text-sm font-medium text-gray-800">Fast Delivery</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">💯</div>
                    <p className="text-sm font-medium text-gray-800">Quality Assured</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">🔄</div>
                    <p className="text-sm font-medium text-gray-800">Easy Returns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}