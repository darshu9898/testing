// src/pages/api/products/index.js - Fixed version
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    if (req.method === 'GET') {
      console.log('📦 Products API: GET started')
      
      // Set cache headers BEFORE database query
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
      
      const dbStart = Date.now()
      
      // Ultra-fast query with only essential fields
      const products = await prisma.products.findMany({
        select: {
          productId: true,
          productName: true,
          productDescription: true,
          productPrice: true,
          productStock: true,
          productImage: true,
        },
        where: {
          productStock: {
            gte: 0 // Only show products that exist
          }
        },
        orderBy: { 
          productId: 'desc' 
        },
        take: 50 // Limit for faster loading
      })
      
      console.log(`💾 Database query: ${Date.now() - dbStart}ms`)
      console.log(`✅ Total API time: ${Date.now() - startTime}ms`)
      console.log(`📊 Found ${products.length} products`)
      
      return res.status(200).json(products)
    }

    if (req.method === 'POST') {
      const { Name, Description = '', Price, Stock = 0, Image = null } = req.body
      
      if (!Name || Price == null || isNaN(Price)) {
        return res.status(400).json({ error: 'Name and valid price are required' })
      }
      
      const parsedPrice = parseFloat(Price)
      const parsedStock = parseInt(Stock, 10)
      
      if (parsedPrice < 0 || parsedStock < 0) {
        return res.status(400).json({ error: 'Price and stock cannot be negative' })
      }
      
      try {
        const newProduct = await prisma.products.create({
          data: {
            productName: Name.trim(),
            productDescription: Description.trim(),
            productPrice: parsedPrice,
            productStock: parsedStock,
            productImage: Image
          }
        })
        
        return res.status(201).json(newProduct)
        
      } catch (createError) {
        if (createError.code === 'P2002') {
          return res.status(400).json({ error: 'Product name already exists' })
        }
        throw createError
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('❌ Products API Error:', error)
    return res.status(500).json({
      error: 'Internal Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
  // REMOVED: Don't disconnect Prisma - let connection pool handle it
}