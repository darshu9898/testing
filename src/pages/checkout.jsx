import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function Checkout() {
  const router = useRouter();
    const { user, isAuthenticated } = useAuth();
  
  // State management
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  
  // Address form state
  const [newAddress, setNewAddress] = useState({
    addressLabel: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phoneNumber: '',
    isDefault: false
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch cart items and addresses
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchCart(), fetchAddresses()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
        
        // Redirect to cart if empty
        if (!data.items || data.items.length === 0) {
          router.push('/cart');
        }
      } else {
        console.error('Failed to fetch cart');
        router.push('/cart');
      }
    } catch (error) {
      console.error('Cart fetch error:', error);
      router.push('/cart');
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        
        // Auto-select default address
        const defaultAddr = data.addresses?.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.addressId);
        }
      }
    } catch (error) {
      console.error('Addresses fetch error:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAddress)
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(prev => [...prev, data.address]);
        setSelectedAddressId(data.address.addressId);
        setShowAddressForm(false);
        setNewAddress({
          addressLabel: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          phoneNumber: '',
          isDefault: false
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add address');
      }
    } catch (error) {
      console.error('Add address error:', error);
      alert('Failed to add address');
    }
  };

  const applyPromoCode = () => {
    const code = promoCode.toLowerCase().trim();
    if (code === "welcome10") {
      setDiscount(10);
    } else if (code === "ayurveda20") {
      setDiscount(20);
    } else if (code === "newuser15") {
      setDiscount(15);
    } else {
      alert("Invalid promo code");
      setDiscount(0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const selectedAddress = addresses.find(addr => addr.addressId === selectedAddressId);
      
      const response = await fetch('/api/user/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress: selectedAddress.fullAddress,
          paymentMethod: paymentMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Simulate payment process based on method
        if (paymentMethod === 'cod') {
          // Cash on delivery - direct success
          router.push(`/order-confirmation?orderId=${data.order.orderId}&payment=cod`);
        } else if (paymentMethod === 'razorpay') {
          // Redirect to payment gateway simulation
          router.push(`/payment?orderId=${data.order.orderId}&amount=${Math.round(finalTotal)}`);
        } else {
          // Other payment methods
          alert(`Payment with ${paymentMethod} will be implemented soon!`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Place order error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.itemTotal || 0), 0);
  const discountAmount = (subtotal * discount) / 100;
  const shipping = subtotal > 499 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const finalTotal = subtotal - discountAmount + shipping + tax;

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Checkout - Trivedam</title>
          <meta name="description" content="Complete your order - Secure checkout for Ayurvedic products" />
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Loading Checkout...</h1>
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
        <title>Checkout - Trivedam</title>
        <meta name="description" content="Complete your order - Secure checkout for Ayurvedic products" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#2F674A] text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
                <p className="text-lg opacity-90">Review and complete your order</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75">Order Total</p>
                <p className="text-2xl font-bold">₹{Math.round(finalTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">Cart</span>
              </div>
              <div className="w-12 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#2F674A] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-black">Checkout</span>
              </div>
              <div className="w-12 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-400">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Section 1: Order Summary */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-black flex items-center gap-2">
                    <span>📦</span> Order Summary ({cartItems.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.cartId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.product?.productImage || '/product.png'}
                            alt={item.product?.productName || 'Product'}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-black">{item.product?.productName}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-[#2F674A] font-bold">₹{item.itemTotal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Promo Code Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-black mb-2">Have a promo code?</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                      />
                      <ButtonDemo
                        label="Apply"
                        bgColor="green"
                        onClick={applyPromoCode}
                      />
                    </div>
                    {discount > 0 && (
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <span>✓</span> {discount}% discount applied! You saved ₹{Math.round(discountAmount)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Delivery Address */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-black flex items-center gap-2">
                    <span>🏠</span> Delivering to {user.user_metadata.full_name}
                  </CardTitle>
                  <CardDescription>
                    Choose where you want your order delivered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <label
                          key={address.addressId}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedAddressId === address.addressId
                              ? 'border-[#2F674A] bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.addressId}
                            checked={selectedAddressId === address.addressId}
                            onChange={(e) => setSelectedAddressId(parseInt(e.target.value))}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                              selectedAddressId === address.addressId
                                ? 'border-[#2F674A] bg-[#2F674A]'
                                : 'border-gray-300'
                            }`}>
                              {selectedAddressId === address.addressId && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-black">{address.addressLabel}</h4>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">{address.fullAddress}</p>
                              {address.phoneNumber && (
                                <p className="text-gray-600 text-sm">Phone: {address.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600 mb-4">No addresses found. Please add a delivery address.</p>
                    </div>
                  )}

                  {/* Add New Address Button/Form */}
                  {!showAddressForm ? (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-2 text-[#2F674A] hover:text-green-700 font-medium"
                      >
                        <span>+</span> Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-black mb-3">Add New Address</h4>
                      <form onSubmit={handleAddAddress} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Address Label (Home, Office, etc.)"
                            value={newAddress.addressLabel}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, addressLabel: e.target.value }))}
                            className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={newAddress.addressLine1}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine1: e.target.value }))}
                            className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Address Line 2 (Optional)"
                            value={newAddress.addressLine2}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, addressLine2: e.target.value }))}
                            className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            pattern="[0-9]{6}"
                            maxLength="6"
                            required
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={newAddress.phoneNumber}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Set as default address</span>
                        </label>
                        <div className="flex gap-2">
                          <ButtonDemo
                            label="Save Address"
                            bgColor="green"
                            onClick={handleAddAddress}
                          />
                          <ButtonDemo
                            label="Cancel"
                            bgColor="black"
                            onClick={() => setShowAddressForm(false)}
                          />
                        </div>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 3: Payment Method */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-black flex items-center gap-2">
                    <span>💳</span> Payment Method
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Razorpay */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'razorpay' ? 'border-[#2F674A] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'razorpay' ? 'border-[#2F674A] bg-[#2F674A]' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'razorpay' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-black">Credit/Debit Cards & UPI</h4>
                          <p className="text-sm text-gray-600">Pay securely with cards, UPI, or net banking</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">💳 Cards</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">📱 UPI</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🏦 Net Banking</span>
                          </div>
                        </div>
                        <span className="text-2xl">🔒</span>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-[#2F674A] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'cod' ? 'border-[#2F674A] bg-[#2F674A]' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-black">Cash on Delivery</h4>
                          <p className="text-sm text-gray-600">Pay when your order is delivered</p>
                          <p className="text-xs text-orange-600 mt-1">₹25 COD charges applicable</p>
                        </div>
                        <span className="text-2xl">💰</span>
                      </div>
                    </label>

                    {/* Digital Wallets */}
                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'wallet' ? 'border-[#2F674A] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="wallet"
                        checked={paymentMethod === 'wallet'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'wallet' ? 'border-[#2F674A] bg-[#2F674A]' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'wallet' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-black">Digital Wallets</h4>
                          <p className="text-sm text-gray-600">PayTM, PhonePe, Google Pay, Amazon Pay</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">PayTM</span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">PhonePe</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">GPay</span>
                          </div>
                        </div>
                        <span className="text-2xl">📱</span>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Total Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl text-black">Order Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                      <span className="font-medium">₹{subtotal}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%)</span>
                        <span>-₹{Math.round(discountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className={shipping === 0 ? "text-green-600 font-medium" : "font-medium"}>
                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                      </span>
                    </div>

                    {paymentMethod === 'cod' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">COD Charges</span>
                        <span className="font-medium">₹25</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (GST 18%)</span>
                      <span className="font-medium">₹{tax}</span>
                    </div>
                    
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-[#2F674A]">
                        ₹{Math.round(finalTotal + (paymentMethod === 'cod' ? 25 : 0))}
                      </span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <div className="pt-4">
                    <ButtonDemo
                      label={processing ? "Processing..." : "Place Order"}
                      bgColor="green"
                      onClick={handlePlaceOrder}
                      disabled={processing || !selectedAddressId}
                    />
                  </div>

                  {/* Security & Policy Info */}
                  <div className="pt-4 border-t text-center">
                    <div className="text-sm text-gray-600 space-y-2">
                      <p className="flex items-center justify-center gap-2">
                        <span>🔒</span> 256-bit SSL Encrypted
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <span>🛡️</span> PCI DSS Compliant
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <span>↩️</span> 30-day Return Policy
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        By placing this order, you agree to our Terms of Service and Privacy Policy
                      </p>
                    </div>
                  </div>

                  {/* Estimated Delivery */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-1">Estimated Delivery</h4>
                    <p className="text-sm text-green-700">
                      {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">5-7 business days</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Support */}
              <Card className="bg-white mt-4">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-medium text-black">Call Us</p>
                      <p className="text-sm text-blue-600">+91 98765 43210</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-medium text-black">Live Chat</p>
                      <p className="text-sm text-green-600">Available 9 AM - 9 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-medium text-black">Email Support</p>
                      <p className="text-sm text-purple-600">help@trivedam.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card className="bg-white mt-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl mb-1">🏆</div>
                      <p className="text-xs font-medium">5000+</p>
                      <p className="text-xs text-gray-600">Happy Customers</p>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">⭐</div>
                      <p className="text-xs font-medium">4.8/5</p>
                      <p className="text-xs text-gray-600">Customer Rating</p>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">🚚</div>
                      <p className="text-xs font-medium">Free</p>
                      <p className="text-xs text-gray-600">Shipping ₹499+</p>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">🌿</div>
                      <p className="text-xs font-medium">100%</p>
                      <p className="text-xs text-gray-600">Natural</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}