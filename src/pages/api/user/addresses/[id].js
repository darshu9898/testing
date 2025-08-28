// src/pages/api/user/addresses/[id].js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User address [id] request: ${req.method} ${req.url}`)
  
  try {
    const { userId, isAuthenticated } = await getContext(req, res)
    const addressId = parseInt(req.query.id, 10)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!addressId || isNaN(addressId)) {
      return res.status(400).json({ error: 'Valid address ID required' })
    }

    // Check if address exists and belongs to user
    const existingAddress = await prisma.userAddresses.findFirst({
      where: {
        addressId,
        userId: parseInt(userId)
      }
    })

    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found or not authorized' })
    }

    // ============== GET: Fetch Single Address ==============
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        address: {
          ...existingAddress,
          fullAddress: `${existingAddress.addressLine1}${existingAddress.addressLine2 ? ', ' + existingAddress.addressLine2 : ''}, ${existingAddress.city}, ${existingAddress.state} ${existingAddress.postalCode}`
        }
      })
    }

    // ============== PUT: Update Address ==============
    if (req.method === 'PUT') {
      const {
        addressLabel,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phoneNumber,
        isDefault
      } = req.body

      // Build update data
      const updateData = {}
      
      if (addressLabel !== undefined) {
        if (addressLabel.trim().length < 2) {
          return res.status(400).json({ error: 'Address label must be at least 2 characters' })
        }
        updateData.addressLabel = addressLabel.trim()
      }

      if (addressLine1 !== undefined) {
        if (addressLine1.trim().length < 5) {
          return res.status(400).json({ error: 'Address line 1 must be at least 5 characters' })
        }
        updateData.addressLine1 = addressLine1.trim()
      }

      if (addressLine2 !== undefined) {
        updateData.addressLine2 = addressLine2?.trim() || null
      }

      if (city !== undefined) {
        updateData.city = city.trim()
      }

      if (state !== undefined) {
        updateData.state = state.trim()
      }

      if (postalCode !== undefined) {
        if (postalCode.length !== 6 || isNaN(postalCode)) {
          return res.status(400).json({ error: 'Please enter a valid 6-digit postal code' })
        }
        updateData.postalCode = postalCode.trim()
      }

      if (country !== undefined) {
        updateData.country = country.trim()
      }

      if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber?.trim() || null
      }

      if (isDefault !== undefined) {
        updateData.isDefault = isDefault
      }

      // If setting as default, unset other defaults first
      if (isDefault && !existingAddress.isDefault) {
        await prisma.userAddresses.updateMany({
          where: { 
            userId: parseInt(userId),
            addressId: { not: addressId },
            isDefault: true
          },
          data: { isDefault: false }
        })
      }

      // Update timestamp
      updateData.updated_at = new Date()

      const updatedAddress = await prisma.userAddresses.update({
        where: { addressId },
        data: updateData
      })

      console.log(`✅ Address updated: ${addressId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        address: {
          ...updatedAddress,
          fullAddress: `${updatedAddress.addressLine1}${updatedAddress.addressLine2 ? ', ' + updatedAddress.addressLine2 : ''}, ${updatedAddress.city}, ${updatedAddress.state} ${updatedAddress.postalCode}`
        },
        message: 'Address updated successfully'
      })
    }

    // ============== DELETE: Delete Address ==============
    if (req.method === 'DELETE') {
      // Check if this is the only address
      const addressCount = await prisma.userAddresses.count({
        where: { userId: parseInt(userId) }
      })

      // If deleting the default address and there are other addresses
      if (existingAddress.isDefault && addressCount > 1) {
        // Set another address as default
        const nextAddress = await prisma.userAddresses.findFirst({
          where: {
            userId: parseInt(userId),
            addressId: { not: addressId }
          },
          orderBy: { created_at: 'asc' }
        })

        if (nextAddress) {
          await prisma.userAddresses.update({
            where: { addressId: nextAddress.addressId },
            data: { isDefault: true }
          })
        }
      }

      await prisma.userAddresses.delete({
        where: { addressId }
      })

      console.log(`✅ Address deleted: ${addressId} for user ${userId}`)

      return res.status(200).json({
        success: true,
        message: 'Address deleted successfully'
      })
    }

    // ============== PATCH: Set as Default ==============
    if (req.method === 'PATCH') {
      const { action } = req.body

      if (action === 'set_default') {
        // Unset current default
        await prisma.userAddresses.updateMany({
          where: { 
            userId: parseInt(userId),
            isDefault: true
          },
          data: { isDefault: false }
        })

        // Set this address as default
        const updatedAddress = await prisma.userAddresses.update({
          where: { addressId },
          data: { isDefault: true }
        })

        console.log(`✅ Default address set: ${addressId} for user ${userId}`)

        return res.status(200).json({
          success: true,
          address: updatedAddress,
          message: 'Default address updated'
        })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User address [id] error:', error)
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Address not found' })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}