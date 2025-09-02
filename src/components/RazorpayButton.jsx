// src/components/RazorpayButton.js
import { useState } from 'react';
import Head from 'next/head';

const RazorpayButton = ({
  orderId,
  amount,
  customerDetails,
  shippingAddress,
  onSuccess,
  onFailure,
  disabled = false,
  children
}) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        setScriptLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (loading || disabled) return;

    setLoading(true);
    
    try {
      console.log('🚀 Starting payment process for order:', orderId);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create payment order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          shippingAddress: shippingAddress
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      console.log('💳 Razorpay order created:', orderData.razorpayOrderId);

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount * 100, // Convert to paisa
        currency: 'INR',
        name: 'Trivedam',
        description: `Order #${orderId} - Natural Ayurvedic Products`,
        image: '/logo.png', // Your logo
        order_id: orderData.razorpayOrderId,
        customer: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.contact
        },
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.contact
        },
        notes: {
          address: shippingAddress,
          orderId: orderId.toString()
        },
        theme: {
          color: '#2F674A' // Your brand color
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed by user');
            setLoading(false);
          }
        },
        handler: async (response) => {
          console.log('💰 Payment successful:', response);
          
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId
              })
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              console.log('✅ Payment verified:', verifyData);
              
              // Call success callback
              if (onSuccess) {
                onSuccess({
                  orderId: orderId,
                  paymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  amount: orderData.amount,
                  verificationData: verifyData
                });
              }
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            if (onFailure) {
              onFailure({
                error: error.message,
                orderId: orderId,
                paymentId: response.razorpay_payment_id
              });
            }
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          console.error('❌ Razorpay payment error:', error);
          
          if (onFailure) {
            onFailure({
              error: error.description || error.reason || 'Payment failed',
              code: error.code,
              orderId: orderId
            });
          }
          
          setLoading(false);
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('💥 Payment initialization error:', error);
      
      if (onFailure) {
        onFailure({
          error: error.message || 'Failed to initialize payment',
          orderId: orderId
        });
      }
      
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setScriptLoaded(true)}
        />
      </Head>
      
      <button
        onClick={handlePayment}
        disabled={loading || disabled}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all
          ${loading || disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[#2F674A] hover:bg-green-700 active:transform active:scale-95'
          }
          ${loading ? 'animate-pulse' : ''}
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </div>
        ) : (
          children || `Pay ₹${amount}`
        )}
      </button>
    </>
  );
};

export default RazorpayButton;