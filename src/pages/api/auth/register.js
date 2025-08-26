import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getOrSetSessionId } from '@/lib/session'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createSupabaseServerClient(req, res)
  const { email, password, fullName } = req.body

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  try {
    // Get guest session BEFORE auth (for cart merge)
    const guestSessionId = getOrSetSessionId(req, res)
    
    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        }
      }
    })

    if (error) {
      console.error('Registration error:', error.message)
      return res.status(400).json({ error: error.message })
    }

    if (data.user) {
      // 2. Create user in Prisma database
      const prismaUser = await prisma.users.upsert({
        where: { supabaseId: data.user.id },
        update: {
          userEmail: data.user.email,
          userName: fullName || data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        },
        create: {
          supabaseId: data.user.id,
          userEmail: data.user.email,
          userName: fullName || data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        }
      })

      // 3. Merge guest cart if exists (don't wait for login)
      if (guestSessionId) {
        try {
          const guestCartItems = await prisma.cart.findMany({
            where: { sessionId: guestSessionId },
            include: { product: true }
          })

          let mergedCount = 0
          for (const guestItem of guestCartItems) {
            const existing = await prisma.cart.findFirst({
              where: { 
                userId: prismaUser.userId, 
                productId: guestItem.productId 
              }
            })

            if (existing) {
              // Combine quantities
              const newQty = Math.min(
                existing.quantity + guestItem.quantity,
                guestItem.product.productStock
              )
              await prisma.cart.update({
                where: { cartId: existing.cartId },
                data: { quantity: newQty }
              })
            } else {
              // Create new user cart item
              await prisma.cart.create({
                data: {
                  userId: prismaUser.userId,
                  productId: guestItem.productId,
                  quantity: Math.min(guestItem.quantity, guestItem.product.productStock)
                }
              })
            }
            mergedCount++
          }

          // Remove guest cart items
          await prisma.cart.deleteMany({
            where: { sessionId: guestSessionId }
          })

          console.log(`Merged ${mergedCount} cart items during registration`)
        } catch (mergeError) {
          console.error('Cart merge during registration failed:', mergeError)
          // Don't fail registration if cart merge fails
        }
      }

      // IMPORTANT: Sign out the user immediately after registration
      // This ensures consistent flow: register -> login page -> manual login
      try {
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.warn('Failed to sign out after registration:', signOutError.message)
      }

      return res.status(201).json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: prismaUser.userName,
          userId: prismaUser.userId
        },
        message: 'Registration successful! Please sign in to continue.'
      })
    }

    return res.status(400).json({ error: 'Registration failed' })
  } catch (error) {
    console.error('Registration server error:', error)
    
    // Handle duplicate email error specifically
    if (error.code === 'P2002' && error.meta?.target?.includes('userEmail')) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    
    return res.status(500).json({ error: 'Internal server error' })
  }
}