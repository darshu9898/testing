import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/contexts/CartContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  const { addToCart } = useCart();

  const handleAddToCart = useCallback(async (product, quantity = 1) => {
    try {
      const result = await addToCart(product.productId, quantity);
      
      if (result.action === 'created') {
        alert(`✅ ${product.productName} added to cart`);
      } else if (result.action === 'updated') {
        alert(`✅ ${product.productName} quantity updated in cart`);
      } else if (result.action === 'exists') {
        alert(`ℹ️ ${product.productName} is already in your cart`);
      }

    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Something went wrong while adding to cart');
    }
  }, [addToCart]);

  const fetchProducts = useCallback(async () => {
    const startTime = Date.now();
    console.log('🔄 Starting product fetch...');
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimized fetch with better caching and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300, stale-while-revalidate=60',
        },
        signal: controller.signal,
        // Add keep-alive for better connection reuse
        keepalive: true
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 API Response: ${Date.now() - startTime}ms`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📦 Products loaded: ${data.length} items in ${Date.now() - startTime}ms`);
      
      setProducts(data || []);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        console.error('❌ Error fetching products:', error);
        setError(error.message);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Loading state with skeleton
  if (loading) {
    return (
      <>
        <Head>
          <title>Products - Trivedam</title>
          <meta name="description" content="Discover our range of authentic Ayurvedic products" />
        </Head>
        <div className="pt-16 min-h-screen">
          <div className="bg-[#2F674A] text-white py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
              <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-black">All Products</h2>
            
            {/* Loading Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                  <div className="h-80 bg-gray-300 rounded-t-lg"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>Products - Trivedam</title>
        </Head>
        <div className="pt-16 min-h-screen">
          <div className="bg-[#2F674A] text-white py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
              <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <p className="text-red-600 mb-4">Error loading products: {error}</p>
              <button 
                onClick={fetchProducts}
                className="bg-[#2F674A] text-white px-4 py-2 rounded hover:bg-[#245c3d] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Products - Trivedam</title>
        <meta name="description" content="Discover our range of authentic Ayurvedic products" />
        <link rel="preload" href="/api/products" as="fetch" crossOrigin="anonymous" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#2F674A] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
            <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">All Products</h2>
          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-gray-900">
              {products.map((product) => (
                <Card
                  key={product.productId}
                  className="bg-white hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader>
                    <div className="relative h-80 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                      {product.productImage ? (
                        <Image
                          src={product.productImage}
                          alt={product.productName}
                          fill
                          className="object-cover transition-transform duration-200 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+i+d0+fLBfZZ7jGDvWmMEFJemRiHW5wvmAJvkxRWK8VL6/w8NwOLDOdQrnJI9q1MRpgYg5l5dPCpWm7OdUhTW0XdyLDGtY2lYTJmwQF5+hXfKIWPGFvN7APfqTcCyDwl0ld/iDDZpWrYD4faf6gQYO0qlAZEhJJjOASPeV2ZW6l9F3APnKHFBF0NkZhWAkdLJ/E/lPyZwvnAJgH9AhEJnCXSaWqCwgDCfuFfYdgHqIdvVGVOKV4/D0qV9vFi0QBgWWYm4GEfpYQ4kQRWaTyAOdTmvqmV4H7wYINwdw8nQ2DF4/VzE/9k="
                          loading="lazy"
                          onError={(e) => {
                            console.warn(`Failed to load image for ${product.productName}`);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{product.productName}</CardTitle>
                    <CardDescription className="line-clamp-3">{product.productDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-[#2F674A]">
                        ₹{product.productPrice}
                      </span>
                      {product.productStock > 0 ? (
                        <ButtonDemo
                          label="Add to Cart"
                          bgColor="green"
                          onClick={() => handleAddToCart(product)}
                        />
                      ) : (
                        <span className="text-red-600 font-semibold">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No products available at the moment.</p>
              <button 
                onClick={fetchProducts}
                className="bg-[#2F674A] text-white px-6 py-2 rounded hover:bg-[#245c3d] transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}