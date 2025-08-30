import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function Cart() {
  const router = useRouter();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch cart items
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart', {
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      } else {
        console.error('Failed to fetch cart');
        setCartItems([]);
      }
    } catch (error) {
      console.error('Cart fetch error:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Update quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.action === 'deleted') {
          // Remove item from state
          setCartItems(prev => prev.filter(item => item.productId !== productId));
        } else if (data.action === 'updated') {
          // Update item in state
          setCartItems(prev => prev.map(item => 
            item.productId === productId 
              ? { ...item, quantity: data.item.quantity, itemTotal: data.item.product.productPrice * data.item.quantity }
              : item
          ));
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update quantity');
        // Refresh cart to sync state
        fetchCart();
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      alert('Failed to update quantity');
      fetchCart();
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Remove item
  const removeItem = async (productId) => {
    if (!confirm('Remove this item from cart?')) return;
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setCartItems(prev => prev.filter(item => item.productId !== productId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Remove item error:', error);
      alert('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Add item to cart (for recommended products)
  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.action === 'created') {
          fetchCart(); // Refresh cart
        } else {
          alert('Item already in cart');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add item to cart');
    }
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(10);
    } else if (promoCode.toLowerCase() === "ayurveda20") {
      setDiscount(20);
    } else {
      alert("Invalid promo code");
      setDiscount(0);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.itemTotal || 0), 0);
  const discountAmount = (subtotal * discount) / 100;
  const shipping = subtotal > 499 ? 0 : 50;
  const total = subtotal - discountAmount + shipping;

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsCheckingOut(true);
    // Navigate to checkout page (to be implemented later)
    setTimeout(() => {
      router.push('/checkout')
      setIsCheckingOut(false);
    }, 500);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Shopping Cart - Trivedam</title>
          <meta name="description" content="Review your selected Ayurvedic products and proceed to checkout" />
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="animate-spin text-4xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold mb-4 text-black">Loading Cart...</h1>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Head>
          <title>Shopping Cart - Trivedam</title>
          <meta name="description" content="Review your selected Ayurvedic products and proceed to checkout" />
        </Head>
        
        <div className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto bg-white">
              <CardContent className="p-12 text-center">
                <div className="text-8xl mb-6">🛒</div>
                <h1 className="text-3xl font-bold mb-4 text-black">Your Cart is Empty</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Looks like you haven't added any items to your cart yet. 
                  Explore our natural Ayurvedic products to start your wellness journey.
                </p>
                <ButtonDemo
                  label="Shop Now"
                  bgColor="green"
                  onClick={() => router.push('/products')}
                />
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
        <title>Shopping Cart - Trivedam</title>
        <meta name="description" content="Review your selected Ayurvedic products and proceed to checkout" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Header */}
        <div className="bg-[#2F674A] text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Shopping Cart</h1>
            <p className="text-xl opacity-90">Review your selected products</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-2xl text-black">
                    Cart Items ({cartItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div key={item.cartId} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.product?.productImage || '/product.png'}
                            alt={item.product?.productName || 'Product'}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-bold text-lg text-black">{item.product?.productName}</h3>
                          <p className="text-gray-600 text-sm">{item.product?.productDescription}</p>
                          <p className="text-[#2F674A] font-bold text-lg">₹{item.product?.productPrice}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={updating[item.productId] || item.quantity <= 1}
                            className="w-8 cursor-pointer h-8 rounded-full bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-black">
                            {updating[item.productId] ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={updating[item.productId]}
                            className="w-8 cursor-pointer h-8 rounded-full bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg text-black">₹{item.itemTotal}</p>
                          <button
                            onClick={() => removeItem(item.productId)}
                            disabled={updating[item.productId]}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-1"
                          >
                            {updating[item.productId] ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Continue Shopping */}
              <div className="mt-6">
                <ButtonDemo
                  label="← Continue Shopping"
                  bgColor="black"
                  onClick={() => router.push('/products')}
                />
              </div>
            </div>

            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                <Card className="bg-white relative z-10">
                  <CardHeader>
                    <CardTitle className="text-xl text-black">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Promo Code */}
                    <div className="border-b pb-4">
                      <h3 className="font-bold text-black mb-2">Promo Code</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-600 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-[#2F674A] bg-white"
                        />
                        <ButtonDemo
                          label="Apply"
                          bgColor="green"
                          onClick={applyPromoCode}
                        />
                      </div>
                      {discount > 0 && (
                        <p className="text-green-600 text-sm mt-2">
                          ✓ {discount}% discount applied!
                        </p>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-bold text-gray-900">₹{subtotal}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({discount}%)</span>
                          <span>-₹{Math.round(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className={shipping === 0 ? "text-green-600 font-bold" : "font-bold"}>
                          {shipping === 0 ? "FREE" : `₹${shipping}`}
                        </span>
                      </div>
                      {shipping > 0 && (
                        <p className="text-sm text-gray-600">
                          Add ₹{499 - subtotal} more for free shipping
                        </p>
                      )}
                      <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-[#2F674A] text-gray-900">₹{Math.round(total)}</span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <div className="pt-4">
                      <ButtonDemo
                        label={isCheckingOut ? "Processing..." : "Proceed to Checkout"}
                        bgColor="green"
                        onClick={handleCheckout}
                      />
                    </div>

                    {/* Security Info */}
                    <div className="text-center pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <p className="flex items-center justify-center gap-2 mb-2">
                          <span>🔒</span> Secure Checkout
                        </p>
                        <p>SSL Encrypted | PCI Compliant</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card className="bg-white relative z-10 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">We Accept</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm font-semibold">
                      <div className="bg-blue-500 text-white p-2 rounded-lg shadow">Card</div>
                      <div className="bg-orange-500 text-white p-2 rounded-lg shadow">UPI</div>
                      <div className="bg-green-600 text-white p-2 rounded-lg shadow">Banking</div>
                      <div className="bg-purple-600 text-white p-2 rounded-lg shadow">COD</div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>

          {/* Recommended Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-black">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { id: 1, name: "Neem Face Wash", price: 149, image: "/product.png" },
                { id: 2, name: "Triphala Powder", price: 189, image: "/combo.jpg" },
                { id: 3, name: "Beard Growth Oil", price: 279, image: "/product.png" },
                { id: 4, name: "Chyawanprash", price: 349, image: "/combo.jpg" }
              ].map((product, index) => (
                <Card key={index} className="bg-white hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="relative h-32 mb-3">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-bold text-sm mb-2">{product.name}</h3>
                    <p className="text-[#2F674A] font-bold">₹{product.price}</p>
                    <div className="mt-3">
                      <ButtonDemo
                        label="Add to Cart"
                        bgColor="green"
                        onClick={() => addToCart(product.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}