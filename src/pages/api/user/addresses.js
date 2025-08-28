// src/pages/api/user/addresses.js
import { getContext } from '@/lib/getContext'
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  console.log(`📥 User addresses request: ${req.method} ${req.url}`)
  
  try {
    const { userId, isAuthenticated } = await getContext(req, res)

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // ============== GET: Fetch User Addresses ==============
    if (req.method === 'GET') {
      const addresses = await prisma.userAddresses.findMany({
        where: { userId: parseInt(userId) },
        orderBy: [
          { isDefault: 'desc' }, // Default address first
          { created_at: 'desc' }
        ]
      })

      return res.status(200).json({
        success: true,
        addresses: addresses.map(addr => ({
          ...addr,
          fullAddress: `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} ${addr.postalCode}`
        }))
      })
    }

    // ============== POST: Create New Address ==============
    if (req.method === 'POST') {
      const {
        addressLabel,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country = 'India',
        phoneNumber,
        isDefault = false
      } = req.body

      // Validation
      if (!addressLabel || !addressLine1 || !city || !state || !postalCode) {
        return res.status(400).json({ 
          error: 'Address label, line 1, city, state, and postal code are required' 
        })
      }

      if (addressLabel.trim().length < 2) {
        return res.status(400).json({ error: 'Address label must be at least 2 characters' })
      }

      if (addressLine1.trim().length < 5) {
        return res.status(400).json({ error: 'Address line 1 must be at least 5 characters' })
      }

      if (postalCode.length !== 6 || isNaN(postalCode)) {
        return res.status(400).json({ error: 'Please enter a valid 6-digit postal code' })
      }

      // Check if user already has 10 addresses (reasonable limit)
      const existingCount = await prisma.userAddresses.count({
        where: { userId: parseInt(userId) }
      })

      if (existingCount >= 10) {
        return res.status(400).json({ 
          error: 'Maximum 10 addresses allowed per user' 
        })
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await prisma.userAddresses.updateMany({
          where: { 
            userId: parseInt(userId),
            isDefault: true
          },
          data: { isDefault: false }
        })
      }

      // If user has no addresses, make this one default
      const shouldBeDefault = isDefault || existingCount === 0

      const newAddress = await prisma.userAddresses.create({
        data: {
          userId: parseInt(userId),
          addressLabel: addressLabel.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          phoneNumber: phoneNumber?.trim() || null,
          isDefault: shouldBeDefault
        }
      })

      console.log(`✅ Address created for user ${userId}: ${newAddress.addressId}`)

      return res.status(201).json({
        success: true,
        address: {
          ...newAddress,
          fullAddress: `${newAddress.addressLine1}${newAddress.addressLine2 ? ', ' + newAddress.addressLine2 : ''}, ${newAddress.city}, ${newAddress.state} ${newAddress.postalCode}`
        },
        message: 'Address added successfully'
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('💥 User addresses error:', error)
    
    // Handle duplicate address label
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Address label already exists. Please use a different label.' 
      })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    })
  }
}