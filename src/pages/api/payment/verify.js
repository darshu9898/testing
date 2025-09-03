// src/pages/api/payment/verify.js
import crypto from 'crypto';
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Verifying Razorpay payment...');

  try {
    const { userId, isAuthenticated } = await getContext(req, res);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ 
        error: 'Missing required payment verification data' 
      });
    }

    // Generate expected signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('🔐 Signature verification:', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpay_signature.substring(0, 10) + '...',
      match: expectedSignature === razorpay_signature
    });

    // Verify signature
    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      console.error('❌ Invalid payment signature');
      
      // Update payment status to failed
      await prisma.payments.updateMany({
        where: {
          razorpayOrderId: razorpay_order_id,
          orderId: parseInt(orderId)
        },
        data: {
          paymentStatus: 'failed',
          paymentDate: new Date()
        }
      });

      return res.status(400).json({ 
        error: 'Invalid payment signature',
        success: false 
      });
    }

    // Signature is valid, update payment record
    const updatedPayment = await prisma.payments.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        orderId: parseInt(orderId),
        userId: parseInt(userId)
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: 'paid',
        paymentDate: new Date()
      }
    });

    if (updatedPayment.count === 0) {
      console.error('❌ Payment record not found or unauthorized');
      return res.status(404).json({ 
        error: 'Payment record not found or unauthorized access' 
      });
    }

    // Fetch the updated order with payment details
    const order = await prisma.orders.findUnique({
      where: { orderId: parseInt(orderId) },
      include: {
        user: {
          select: {
            userName: true,
            userEmail: true
          }
        },
        orderDetails: {
          include: {
            product: {
              select: {
                productName: true,
                productPrice: true
              }
            }
          }
        },
        payments: {
          where: {
            razorpayPaymentId: razorpay_payment_id
          }
        }
      }
    });

    console.log('✅ Payment verified successfully:', {
      orderId,
      paymentId: razorpay_payment_id,
      amount: order?.orderAmount
    });

    // Here you can add additional logic like:
    // - Send confirmation email
    // - Update inventory
    // - Trigger order processing workflow
    // - Send SMS notifications

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: orderId,
      order: {
        orderId: order.orderId,
        orderAmount: order.orderAmount,
        orderDate: order.orderDate,
        customerName: order.user.userName,
        customerEmail: order.user.userEmail,
        items: order.orderDetails.map(detail => ({
          productName: detail.product.productName,
          quantity: detail.quantity,
          price: detail.productPrice,
          total: detail.productPrice * detail.quantity
        })),
        paymentDetails: order.payments[0]
      }
    });

  } catch (error) {
    console.error('💥 Payment verification error:', error);

    // Try to update payment status to failed
    try {
      if (req.body.razorpay_order_id && req.body.orderId) {
        await prisma.payments.updateMany({
          where: {
            razorpayOrderId: req.body.razorpay_order_id,
            orderId: parseInt(req.body.orderId)
          },
          data: {
            paymentStatus: 'failed',
            paymentDate: new Date()
          }
        });
      }
    } catch (updateError) {
      console.error('Failed to update payment status to failed:', updateError);
    }

    return res.status(500).json({
      error: 'Payment verification failed',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}