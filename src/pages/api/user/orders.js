// src/pages/api/user/orders.js
import { getContext } from '@/lib/getContext';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    const { userId, isAuthenticated } = await getContext(req, res);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // GET: Fetch user orders
    if (req.method === 'GET') {
      const { orderId } = req.query;

      let whereClause = { userId: parseInt(userId) };
      
      // If specific order requested
      if (orderId) {
        whereClause.orderId = parseInt(orderId);
      }

      const orders = await prisma.orders.findMany({
        where: whereClause,
        include: {
          orderDetails: {
            include: {
              product: {
                select: {
                  productName: true,
                  productImage: true,
                  productPrice: true
                }
              }
            }
          },
          payments: {
            select: {
              paymentMode: true,
              paymentStatus: true,
              paymentDate: true,
              razorpayPaymentId: true
            }
          }
        },
        orderBy: {
          orderDate: 'desc'
        }
      });

      // Format orders for frontend
      const formattedOrders = orders.map(order => ({
        orderId: order.orderId,
        orderAmount: order.orderAmount,
        orderDate: order.orderDate,
        totalItems: order.orderDetails.length,
        paymentStatus: order.payments[0]?.paymentStatus || 'pending',
        paymentMode: order.payments[0]?.paymentMode || 'unknown',
        items: order.orderDetails.map(detail => ({
          productName: detail.product.productName,
          productImage: detail.product.productImage,
          quantity: detail.quantity,
          productPrice: detail.productPrice,
          lineTotal: detail.productPrice * detail.quantity
        }))
      }));

      return res.status(200).json({ orders: formattedOrders });
    }

    // POST: Create new order
    if (req.method === 'POST') {
      const { shippingAddress, paymentMethod } = req.body;

      if (!shippingAddress) {
        return res.status(400).json({ error: 'Shipping address is required' });
      }

      console.log('🛒 Creating order for user:', userId, 'Payment method:', paymentMethod);

      // Get user's cart items with validation
      const cartItems = await prisma.cart.findMany({
        where: { userId: parseInt(userId) },
        include: { product: true }
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      console.log('📦 Found cart items:', cartItems.length);

      // Validate stock availability before creating order
      for (const item of cartItems) {
        if (!item.product) {
          return res.status(400).json({ error: `Product not found for cart item ${item.cartId}` });
        }
        if (item.quantity > item.product.productStock) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${item.product.productName}. Only ${item.product.productStock} available.` 
          });
        }
      }

      // Calculate total amount
      const orderAmount = cartItems.reduce((total, item) => {
        return total + (item.product.productPrice * item.quantity);
      }, 0);

      console.log('💰 Order amount calculated:', orderAmount);

      // Use transaction for order creation
      const result = await prisma.$transaction(async (tx) => {
        // Create order with order details
        const order = await tx.orders.create({
          data: {
            userId: parseInt(userId),
            orderAmount: orderAmount,
            orderDate: new Date(),
            orderDetails: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                productPrice: item.product.productPrice
              }))
            }
          },
          include: {
            orderDetails: {
              include: {
                product: {
                  select: {
                    productName: true,
                    productImage: true,
                    productPrice: true
                  }
                }
              }
            }
          }
        });

        console.log('✅ Order created with ID:', order.orderId);

        // Handle COD orders - complete the process immediately
        if (paymentMethod === 'cod') {
          console.log('💰 Processing COD order...');

          // Create COD payment record
          await tx.payments.create({
            data: {
              userId: parseInt(userId),
              orderId: order.orderId,
              razorpayOrderId: `cod_${order.orderId}_${Date.now()}`,
              paymentMode: 'cod',
              paymentStatus: 'pending_cod', // COD orders are pending until delivery
              paymentAmount: orderAmount,
              paymentDate: new Date()
            }
          });

          // Update product stock for COD orders
          for (const item of cartItems) {
            await tx.products.update({
              where: { productId: item.productId },
              data: { 
                productStock: { 
                  decrement: item.quantity 
                } 
              }
            });
            console.log(`📉 Reduced stock for product ${item.productId} by ${item.quantity}`);
          }

          // Clear user's cart for COD orders
          const deletedCartItems = await tx.cart.deleteMany({
            where: { userId: parseInt(userId) }
          });
          console.log(`🧹 Cleared ${deletedCartItems.count} items from cart`);
        }

        return order;
      });

      // Prepare order response
      const orderResponse = {
        orderId: result.orderId,
        orderAmount: result.orderAmount,
        orderDate: result.orderDate,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        items: result.orderDetails.map(detail => ({
          productName: detail.product.productName,
          productImage: detail.product.productImage,
          quantity: detail.quantity,
          productPrice: detail.productPrice,
          lineTotal: detail.productPrice * detail.quantity
        })),
        totalItems: result.orderDetails.length,
        status: paymentMethod === 'cod' ? 'confirmed_cod' : 'pending_payment'
      };

      const successMessage = paymentMethod === 'cod' 
        ? 'COD order created and confirmed successfully!' 
        : 'Order created successfully. Proceed with payment.';

      console.log(`✅ ${successMessage} Order ID: ${result.orderId}`);

      return res.status(201).json({ 
        success: true, 
        order: orderResponse,
        message: successMessage
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('💥 Orders API Error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate order detected' });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Referenced record not found' });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid reference in order data' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}