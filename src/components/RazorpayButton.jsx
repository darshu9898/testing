// src/components/RazorpayButton.jsx
import { useState, useEffect } from 'react';
import { ButtonDemo } from './Button';

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
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert('Payment system is loading. Please wait and try again.');
      return;
    }

    if (!window.Razorpay) {
      alert('Payment system not available. Please refresh and try again.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting payment process for order:', orderId);

      // Step 1: Create Razorpay order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          shippingAddress: shippingAddress
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('❌ Create order failed:', orderResponse.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Server error: ${orderResponse.status}`);
        } catch {
          throw new Error(`Server error: ${orderResponse.status} - ${errorText}`);
        }
      }

      const orderData = await orderResponse.json();

      console.log('✅ Razorpay order created:', orderData.razorpayOrderId);

      // Step 2: Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paisa
        currency: 'INR',
        order_id: orderData.razorpayOrderId,
        name: 'Trivedam',
        description: `Order #${orderId} - Ayurvedic Products`,
        image: '/logo.png', // Your logo URL
        prefill: {
          name: customerDetails.name || '',
          email: customerDetails.email || '',
          contact: customerDetails.contact || '',
        },
        notes: {
          order_id: orderId.toString(),
          shipping_address: shippingAddress,
        },
        theme: {
          color: '#2F674A', // Your brand color
        },
        modal: {
          ondismiss: () => {
            console.log('💭 Payment modal dismissed');
            setIsLoading(false);
          },
        },
        handler: async (response) => {
          console.log('💰 Payment successful:', response.razorpay_payment_id);
          
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              console.log('✅ Payment verified successfully');
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: orderId,
                order: verifyData.order,
                ...verifyData
              });
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification failed:', error);
            onFailure({
              error: error.message || 'Payment verification failed',
              paymentId: response.razorpay_payment_id,
              orderId: orderId
            });
          } finally {
            setIsLoading(false);
          }
        },
      };

      // Step 4: Open Razorpay checkout
      console.log('🎯 Opening Razorpay checkout...');
      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', (response) => {
        console.error('💥 Payment failed:', response.error);
        setIsLoading(false);
        
        onFailure({
          error: response.error.description || 'Payment failed',
          code: response.error.code,
          orderId: orderId,
          razorpayError: response.error
        });
      });

      razorpayInstance.open();

    } catch (error) {
      console.error('💥 Payment initiation failed:', error);
      setIsLoading(false);
      
      onFailure({
        error: error.message || 'Failed to initiate payment',
        orderId: orderId
      });
    }
  };

  return (
    <ButtonDemo
      label={children || `Pay ₹${amount}`}
      bgColor="green"
      onClick={handlePayment}
      disabled={disabled || isLoading || !razorpayLoaded}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          Processing Payment...
        </div>
      ) : !razorpayLoaded ? (
        'Loading Payment System...'
      ) : (
        children || `Pay ₹${amount}`
      )}
    </ButtonDemo>
  );
};

export default RazorpayButton;