// src/pages/api/payment/create-order.js
import Razorpay from 'razorpay';
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔄 Creating Razorpay order...');

  try {
    const { userId, user, isAuthenticated } = await getContext(req, res);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { orderId, shippingAddress } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch the order from database
    const order = await prisma.orders.findUnique({
      where: { orderId: parseInt(orderId) },
      include: {
        user: {
          select: {
            userId: true,
            userName: true,
            userEmail: true,
            userPhone: true
          }
        },
        orderDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to the authenticated user
    if (order.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized access to order' });
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payments.findFirst({
      where: { 
        orderId: parseInt(orderId),
        paymentStatus: { in: ['created', 'attempted', 'paid'] }
      }
    });

    let razorpayOrderId;

    if (existingPayment && existingPayment.paymentStatus !== 'failed') {
      // Use existing Razorpay order
      razorpayOrderId = existingPayment.razorpayOrderId;
      console.log('📝 Using existing Razorpay order:', razorpayOrderId);
    } else {
      // Create new Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: order.orderAmount * 100, // Amount in paisa
        currency: 'INR',
        receipt: `order_${orderId}_${Date.now()}`,
        notes: {
          orderId: orderId.toString(),
          userId: userId.toString(),
          customerName: order.user.userName,
          customerEmail: order.user.userEmail
        }
      });

      razorpayOrderId = razorpayOrder.id;
      console.log('✅ Created new Razorpay order:', razorpayOrderId);

      // Create or update payment record
      await prisma.payments.upsert({
        where: {
          orderId: parseInt(orderId)
        },
        create: {
          userId: parseInt(userId),
          orderId: parseInt(orderId),
          razorpayOrderId: razorpayOrderId,
          paymentMode: 'razorpay',
          paymentStatus: 'created',
          paymentAmount: order.orderAmount
        },
        update: {
          razorpayOrderId: razorpayOrderId,
          paymentStatus: 'created',
          paymentDate: new Date()
        }
      });
    }

    // Prepare response data for frontend
    const responseData = {
      razorpayOrderId: razorpayOrderId,
      amount: order.orderAmount,
      currency: 'INR',
      orderId: orderId,
      customerDetails: {
        name: order.user.userName,
        email: order.user.userEmail,
        contact: order.user.userPhone ? order.user.userPhone.toString() : undefined
      },
      orderDetails: {
        items: order.orderDetails.map(detail => ({
          name: detail.product.productName,
          quantity: detail.quantity,
          price: detail.productPrice
        }))
      },
      shippingAddress: shippingAddress || order.user.userAddress
    };

    console.log('📦 Order prepared for payment:', {
      razorpayOrderId,
      orderId,
      amount: order.orderAmount
    });

    return res.status(200).json({
      success: true,
      ...responseData
    });

  } catch (error) {
    console.error('💥 Create order error:', error);
    
    // Handle Razorpay specific errors
    if (error.error) {
      const razorpayError = error.error;
      return res.status(400).json({
        error: 'Payment gateway error',
        details: razorpayError.description || razorpayError.reason || 'Unknown payment error'
      });
    }

    return res.status(500).json({
      error: 'Failed to create payment order',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}