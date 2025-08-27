// src/pages/api/user/address.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User address request: ${req.method} ${req.url}`)
  
  try {
    const { userId, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ============== GET: Fetch User Address ==============
    if (req.method === 'GET') {
      const user = await prisma.users.findUnique({
        where: { userId: parseInt(userId) },
        select: {
          userId: true,
          userName: true,
          userAddress: true,
          userPhone: true
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json({
        success: true,
        address: {
          userId: user.userId,
          userName: user.userName,
          userAddress: user.userAddress,
          userPhone: user.userPhone?.toString() || null,
          hasAddress: !!user.userAddress
        }
      })
    }

    // ============== PUT: Update User Address ==============
    if (req.method === 'PUT') {
      const { userAddress, userPhone } = req.body

      if (!userAddress || userAddress.trim().length < 10) {
        return res.status(400).json({ 
          error: 'Valid address is required (minimum 10 characters)' 
        })
      }

      const updateData = {
        userAddress: userAddress.trim()
      }

      // Validate and add phone if provided
      if (userPhone !== undefined) {
        if (userPhone && (isNaN(userPhone) || userPhone.toString().length < 10)) {
          return res.status(400).json({ error: 'Invalid phone number format' })
        }
        updateData.userPhone = userPhone ? BigInt(userPhone) : null
      }

      try {
        const updatedUser = await prisma.users.update({
          where: { userId: parseInt(userId) },
          data: updateData,
          select: {
            userId: true,
            userName: true,
            userAddress: true,
            userPhone: true
          }
        })

        console.log(`✅ Address updated for user ${userId}`)

        return res.status(200).json({
          success: true,
          message: 'Address updated successfully',
          address: {
            ...updatedUser,
            userPhone: updatedUser.userPhone?.toString() || null
          }
        })

      } catch (dbError) {
        if (dbError.code === 'P2025') {
          return res.status(404).json({ error: 'User not found' })
        }
        throw dbError
      }
    }

    // ============== DELETE: Clear User Address ==============
    if (req.method === 'DELETE') {
      try {
        await prisma.users.update({
          where: { userId: parseInt(userId) },
          data: { userAddress: null }
        })

        console.log(`✅ Address cleared for user ${userId}`)

        return res.status(200).json({
          success: true,
          message: 'Address cleared successfully'
        })

      } catch (dbError) {
        if (dbError.code === 'P2025') {
          return res.status(404).json({ error: 'User not found' })
        }
        throw dbError
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User address error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}