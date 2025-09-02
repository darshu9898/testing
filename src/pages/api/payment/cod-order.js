// src/pages/api/payment/cod-confirm.js
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📦 Processing COD order confirmation...');

  try {
    const { userId, isAuthenticated } = await getContext(req, res);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Process COD order (similar to payment verification but for COD)
    const result = await prisma.$transaction(async (tx) => {
      console.log('🔄 Processing COD order...');

      // Create a COD payment record
      await tx.payments.create({
        data: {
          userId: parseInt(userId),
          orderId: parseInt(orderId),
          razorpayOrderId: `cod_${orderId}_${Date.now()}`,
          paymentMode: 'cod',
          paymentStatus: 'pending_cod',
          paymentAmount: 0, // Will be updated with actual amount
          paymentDate: new Date()
        }
      });

      // Get order details
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

      if (order.userId !== parseInt(userId)) {
        throw new Error('Unauthorized access to order');
      }

      // Update product stock
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

      // Clear user's cart
      const deletedCart = await tx.cart.deleteMany({
        where: { userId: parseInt(userId) }
      });

      console.log(`🧹 Cleared ${deletedCart.count} items from user's cart`);

      // Update payment record with correct amount
      await tx.payments.updateMany({
        where: {
          orderId: parseInt(orderId),
          paymentMode: 'cod'
        },
        data: {
          paymentAmount: order.orderAmount
        }
      });

      return order;
    });

    console.log('✅ COD order processed successfully:', orderId);

    return res.status(200).json({
      success: true,
      message: 'COD order confirmed successfully',
      orderId: orderId,
      order: {
        orderId: result.orderId,
        orderAmount: result.orderAmount,
        orderDate: result.orderDate,
        paymentMethod: 'cod',
        status: 'confirmed_cod'
      }
    });

  } catch (error) {
    console.error('💥 COD order processing error:', error);
    
    return res.status(500).json({
      error: 'COD order processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}