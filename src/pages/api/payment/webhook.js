// src/pages/api/payment/webhook.js
// Optional: Razorpay webhook handler for production environments
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('📨 Webhook received:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;
        
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentAuthorized(payment) {
  console.log('💰 Payment authorized:', payment.id);
  
  try {
    await prisma.payments.updateMany({
      where: {
        razorpayOrderId: payment.order_id
      },
      data: {
        razorpayPaymentId: payment.id,
        paymentStatus: 'authorized',
        paymentDate: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to update payment status to authorized:', error);
  }
}

async function handlePaymentCaptured(payment) {
  console.log('✅ Payment captured:', payment.id);
  
  try {
    await prisma.payments.updateMany({
      where: {
        razorpayOrderId: payment.order_id
      },
      data: {
        razorpayPaymentId: payment.id,
        paymentStatus: 'paid',
        paymentDate: new Date()
      }
    });

    // Additional logic for successful payment:
    // - Send confirmation email
    // - Update inventory
    // - Trigger order fulfillment
    // - Send SMS notification
    
  } catch (error) {
    console.error('Failed to update payment status to captured:', error);
  }
}

async function handlePaymentFailed(payment) {
  console.log('❌ Payment failed:', payment.id);
  
  try {
    await prisma.payments.updateMany({
      where: {
        razorpayOrderId: payment.order_id
      },
      data: {
        razorpayPaymentId: payment.id,
        paymentStatus: 'failed',
        paymentDate: new Date()
      }
    });

    // Additional logic for failed payment:
    // - Send failure notification
    // - Release any reserved inventory
    // - Log failure reason
    
  } catch (error) {
    console.error('Failed to update payment status to failed:', error);
  }
}

async function handleOrderPaid(order) {
  console.log('🎉 Order paid:', order.id);
  
  try {
    // Find the order in our database
    const dbOrder = await prisma.orders.findFirst({
      where: {
        payments: {
          some: {
            razorpayOrderId: order.id
          }
        }
      },
      include: {
        user: true,
        orderDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (dbOrder) {
      // Additional business logic for completed order:
      // - Send order confirmation email
      // - Create shipment record
      // - Update product inventory
      // - Send SMS confirmation
      
      console.log(`Order #${dbOrder.orderId} completed for user ${dbOrder.user.userEmail}`);
    }
    
  } catch (error) {
    console.error('Failed to process completed order:', error);
  }
}

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}