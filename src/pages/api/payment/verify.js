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

    // Payment signature is valid - now complete the order process
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 Processing successful payment...');

      // Update payment record
      const updatedPayment = await tx.payments.updateMany({
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
        throw new Error('Payment record not found or unauthorized access');
      }

      // Get order details with products
      const order = await tx.orders.findUnique({
        where: { orderId: parseInt(orderId) },
        include: {
          orderDetails: {
            include: { product: true }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update product stock (deduct ordered quantities)
      for (const detail of order.orderDetails) {
        console.log(`📦 Updating stock for product ${detail.productId}, deduct ${detail.quantity}`);
        
        await tx.products.update({
          where: { productId: detail.productId },
          data: { 
            productStock: { 
              decrement: detail.quantity 
            } 
          }
        });
      }

      // Clear user's cart (payment successful, order confirmed)
      const deletedCart = await tx.cart.deleteMany({
        where: { userId: parseInt(userId) }
      });

      console.log(`🧹 Cleared ${deletedCart.count} items from user's cart`);

      return order;
    });

    // Fetch complete order details for response
    const completeOrder = await prisma.orders.findUnique({
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
                productPrice: true,
                productImage: true
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

    console.log('✅ Payment verified and order completed:', {
      orderId,
      paymentId: razorpay_payment_id,
      amount: completeOrder?.orderAmount
    });

    // Here you can add additional logic like:
    // - Send confirmation email
    // - Send SMS notifications  
    // - Trigger order processing workflow

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      paymentId: razorpay_payment_id,
      orderId: orderId,
      order: {
        orderId: completeOrder.orderId,
        orderAmount: completeOrder.orderAmount,
        orderDate: completeOrder.orderDate,
        customerName: completeOrder.user.userName,
        customerEmail: completeOrder.user.userEmail,
        items: completeOrder.orderDetails.map(detail => ({
          productName: detail.product.productName,
          productImage: detail.product.productImage,
          quantity: detail.quantity,
          price: detail.productPrice,
          total: detail.productPrice * detail.quantity
        })),
        paymentDetails: completeOrder.payments[0],
        status: 'confirmed'
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