// src/pages/api/products/index.js - Ultra-optimized version
import prisma from '@/lib/prisma'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    if (req.method === 'GET') {
      console.log('📦 Products API: GET started')
      
      const dbStart = Date.now()
      
      // Optimized query with minimal fields and efficient ordering
      const products = await prisma.products.findMany({
        select: {
          productId: true,
          productName: true,
          productDescription: true,
          productPrice: true,
          productStock: true,
          productImage: true,
          created_at: true
        },
        orderBy: [
          { productStock: 'desc' }, // In-stock items first
          { created_at: 'desc' }    // Then by newest
        ]
      })
      
      console.log(`💾 Products query: ${Date.now() - dbStart}ms`)
      console.log(`✅ Products GET total: ${Date.now() - startTime}ms`)
      
      // Cache for 2 minutes since products don't change frequently
      res.setHeader('Cache-Control', 'public, max-age=120')
      
      return res.status(200).json(products)
    }

    if (req.method === 'POST') {
      console.log('📦 Products API: POST started')
      
      const { Name, Description = '', Price, Stock = 0, Image = null } = req.body

      // Validate required fields
      if (!Name || Price == null || isNaN(Price)) {
        return res.status(400).json({ error: 'Name and valid price are required' })
      }

      // Validate price and stock
      const parsedPrice = parseFloat(Price)
      const parsedStock = parseInt(Stock, 10)
      
      if (parsedPrice < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' })
      }
      
      if (parsedStock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' })
      }

      const dbStart = Date.now()
      
      try {
        const newProduct = await prisma.products.create({
          data: {
            productName: Name.trim(),
            productDescription: Description.trim(),
            productPrice: parsedPrice,
            productStock: parsedStock,
            productImage: Image
          },
          select: {
            productId: true,
            productName: true,
            productDescription: true,
            productPrice: true,
            productStock: true,
            productImage: true,
            created_at: true
          }
        })
        
        console.log(`💾 Product create: ${Date.now() - dbStart}ms`)
        console.log(`✅ Products POST total: ${Date.now() - startTime}ms`)

        return res.status(201).json(newProduct)
        
      } catch (createError) {
        // Handle duplicate product name
        if (createError.code === 'P2002' && createError.meta?.target?.includes('productName')) {
          return res.status(400).json({ error: 'Product name already exists' })
        }
        throw createError
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('❌ Products API Error:', error)
    console.log(`💥 Products API failed: ${Date.now() - startTime}ms`)
    
    return res.status(500).json({ 
      error: 'Internal Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
