// src/pages/api/checkout/guest.js
import { getOrSetSessionId } from '@/lib/session'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sessionId = getOrSetSessionId(req, res)
  const { 
    email, 
    fullName, 
    phone, 
    shippingAddress, 
    createAccount = false,
    password = null 
  } = req.body

  // Validation
  if (!email || !fullName || !shippingAddress) {
    return res.status(400).json({ 
      error: 'Email, name, and shipping address are required' 
    })
  }

  if (createAccount && (!password || password.length < 6)) {
    return res.status(400).json({ 
      error: 'Password must be at least 6 characters for account creation' 
    })
  }

  try {
    // Get guest cart items
    const cartItems = await prisma.cart.findMany({
      where: { sessionId },
      include: { product: true }
    })

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    // Calculate total
    const orderAmount = cartItems.reduce((total, item) => {
      return total + (item.product.productPrice * item.quantity)
    }, 0)

    let userId = null

    // Create account if requested
    if (createAccount) {
      // This would integrate with your auth system
      // For now, create a guest user record
      const newUser = await prisma.users.create({
        data: {
          userEmail: email,
          userName: fullName,
          userPhone: phone ? parseInt(phone) : null,
          userAddress: shippingAddress,
          isGuest: false // They want an account
        }
      })
      userId = newUser.userId
    } else {
      // Create temporary guest user for order tracking
      const guestUser = await prisma.users.create({
        data: {
          userEmail: email,
          userName: fullName,
          userPhone: phone ? parseInt(phone) : null,
          userAddress: shippingAddress,
          isGuest: true // Mark as guest
        }
      })
      userId = guestUser.userId
    }

    // Create order
    const order = await prisma.orders.create({
      data: {
        userId,
        orderAmount,
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
        orderDetails: { include: { product: true } }
      }
    })

    // Clear guest cart
    await prisma.cart.deleteMany({
      where: { sessionId }
    })

    return res.status(200).json({
      success: true,
      order,
      message: createAccount 
        ? 'Order created and account registered!' 
        : 'Order created successfully!',
      nextStep: createAccount 
        ? 'Please check your email to verify your account'
        : 'Order confirmation sent to your email'
    })

  } catch (error) {
    console.error('Guest checkout error:', error)
    return res.status(500).json({ error: 'Checkout failed' })
  }
}