import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Brahmi Hair Oil",
      price: 299,
      quantity: 2,
      image: "/combo.jpg",
      category: "Hair Care"
    },
    {
      id: 2,
      name: "Turmeric Face Pack",
      price: 179,
      quantity: 1,
      image: "/product.png",
      category: "Skin Care"
    },
    {
      id: 3,
      name: "Ashwagandha Capsules",
      price: 499,
      quantity: 1,
      image: "/combo.jpg",
      category: "Wellness"
    }
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(10);
    } else if (promoCode.toLowerCase() === "ayurveda20") {
      setDiscount(20);
    } else {
      alert("Invalid promo code");
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discount) / 100;
  const shipping = subtotal > 499 ? 0 : 50;
  const total = subtotal - discountAmount + shipping;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Simulate checkout process
    setTimeout(() => {
      alert("Order placed successfully! You will receive a confirmation email shortly.");
      setCartItems([]);
      setIsCheckingOut(false);
      router.push('/');
    }, 2000);
  };

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
                      <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="font-bold text-lg text-black">{item.name}</h3>
                          <p className="text-gray-600 text-sm">{item.category}</p>
                          <p className="text-[#2F674A] font-bold text-lg">₹{item.price}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg text-black">₹{item.price * item.quantity}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-sm mt-1"
                          >
                            Remove
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
              <Card className="bg-white sticky top-8">
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
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
                      <span className="font-bold">₹{subtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%)</span>
                        <span>-₹{discountAmount}</span>
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
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#2F674A]">₹{total}</span>
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
              <Card className="bg-white mt-4">
                <CardHeader>
                  <CardTitle className="text-lg text-black">We Accept</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-blue-100 p-2 rounded">💳 Cards</div>
                    <div className="bg-orange-100 p-2 rounded">📱 UPI</div>
                    <div className="bg-green-100 p-2 rounded">🏦 Banking</div>
                    <div className="bg-purple-100 p-2 rounded">💰 COD</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommended Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-black">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: "Neem Face Wash", price: "₹149", image: "/product.png" },
                { name: "Triphala Powder", price: "₹189", image: "/combo.jpg" },
                { name: "Beard Growth Oil", price: "₹279", image: "/product.png" },
                { name: "Chyawanprash", price: "₹349", image: "/combo.jpg" }
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
                    <p className="text-[#2F674A] font-bold">{product.price}</p>
                    <div className="mt-3">
                      <ButtonDemo
                        label="Add to Cart"
                        bgColor="green"
                        onClick={() => {}}
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