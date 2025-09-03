// src/components/RazorpayButton.jsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ButtonDemo } from './Button'

const RazorpayButton = ({
  orderId,
  amount,
  currency = 'INR',
  customerDetails,
  shippingAddress,
  onSuccess,
  onFailure,
  disabled = false,
  className = "",
  children = "Pay Now"
}) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Load Razorpay script once
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      console.log('✅ Razorpay script loaded')
      setRazorpayLoaded(true)
    }
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script')
      alert('Payment gateway failed to load. Check your internet connection.')
    }
    document.body.appendChild(script)
  }, [])

  // Create Razorpay order on backend
  const createRazorpayOrder = async () => {
    console.log('🔄 Creating Razorpay order for DB orderId:', orderId)
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId, shippingAddress })
    })
    const data = await response.json()
    console.log('📦 /create-order response:', data)

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create payment order')
    }
    return data
  }

  // Verify payment with backend
  const verifyPayment = async (paymentData) => {
    console.log('🔍 Sending verify request:', paymentData)
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...paymentData, orderId })
    })
    const data = await response.json()
    console.log('📦 /verify response:', data)

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Payment verification failed')
    }
    return data
  }

const handlePayment = async () => {
  console.log("🟢 handlePayment triggered");

  if (!razorpayLoaded) {
    console.warn("⚠️ Razorpay script not ready");
    alert("Payment gateway not ready. Please wait.");
    return;
  }

  if (!orderId) {
    console.warn("⚠️ No orderId passed to RazorpayButton");
    alert("Order ID missing. Please refresh and try again.");
    return;
  }

  setLoading(true);

  try {
    // 1️⃣ Create Razorpay order on backend
    console.log("📡 Calling /api/payment/create-order for orderId:", orderId);
    const orderData = await createRazorpayOrder();
    console.log("🧾 orderData from backend:", orderData);

    if (!orderData?.razorpayOrderId) {
      throw new Error("❌ No razorpayOrderId returned from backend");
    }
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      throw new Error("❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is undefined in frontend");
    }

    // 2️⃣ Configure Razorpay options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount * 100, // ✅ always convert to paise here
      currency: orderData.currency,
      name: "Trivedam",
      description: `Order #${orderId} - Natural Ayurvedic Products`,
      image: "/logo.jpg",
      order_id: orderData.razorpayOrderId,

      prefill: {
        name: orderData.customerDetails?.name,
        email: orderData.customerDetails?.email,
        contact: orderData.customerDetails?.contact || "",
      },

      notes: {
        shipping_address: orderData.shippingAddress || "",
        order_id: orderId.toString(),
        items: orderData.orderDetails?.items
          ?.map((item) => `${item.name} (${item.quantity}x)`)
          .join(", ") || "",
      },

      theme: { color: "#2F674A" },

      modal: {
        ondismiss: () => {
          console.log("💭 Payment modal dismissed by user");
          setLoading(false);
        },
      },

      handler: async (response) => {
        console.log("🎉 Payment success, Razorpay response:", response);
        try {
          const verifyResult = await verifyPayment(response);
          console.log("✅ Payment verified:", verifyResult);

          if (onSuccess) {
            onSuccess(verifyResult);
          } else {
            router.push(
              `/order-confirmation?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`
            );
          }
        } catch (err) {
          console.error("❌ Verification failed:", err);
          alert(
            `Payment done but verification failed. Contact support with Payment ID: ${response.razorpay_payment_id}`
          );
          if (onFailure) onFailure(err);
        } finally {
          setLoading(false);
        }
      },
    };

    // 3️⃣ Log and open Razorpay widget
    console.log("🕵️ Razorpay checkout options prepared:", options);
    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response) => {
      console.error("💥 Payment failed:", response.error);
      alert(`Payment failed: ${response.error.description || "Unknown error"}`);
      if (onFailure) onFailure(response.error);
      setLoading(false);
    });

    console.log("🚀 Opening Razorpay checkout...");
    rzp.open();
  } catch (err) {
    console.error("💥 Payment init error:", err);
    alert(err.message || "Payment could not be started.");
    if (onFailure) onFailure(err);
    setLoading(false);
  }
};


  return (
    <ButtonDemo
      label={loading ? 'Processing...' : children}
      bgColor="green"
      onClick={handlePayment}
      disabled={disabled || loading || !razorpayLoaded}
      className={`relative ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-600 bg-opacity-75 rounded-lg">
          <div className="animate-spin text-white text-lg">⏳</div>
        </div>
      )}
    </ButtonDemo>
  )
}

export default RazorpayButton
