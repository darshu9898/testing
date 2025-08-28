import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const router = useRouter();

  const addToCart = async (product, quantity = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.productId,
          quantity,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to add to cart');
        return;
      }

      const data = await res.json();

      if (data.action === 'created') {
        alert(`✅ ${product.productName} added to cart`);
      } else if (data.action === 'exists') {
        alert(`ℹ️ ${product.productName} is already in your cart`);
      }

      // optional: update local cart state if you want
      setCart((prev) => [...prev, data.item]);

    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Something went wrong while adding to cart');
    }
  };


  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { cache: 'no-cache' });
      if (response.ok) {
        const data = await response.json(); // API returns an array
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Always assign a random Picsum image for each product
  const getRandomImage = (productId) => {
    return `https://picsum.photos/seed/${productId}/400/300`;
  };

  return (
    <>
      <Head>
        <title>Products - Trivedam</title>
        <meta
          name="description"
          content="Discover our range of authentic Ayurvedic products"
        />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#2F674A] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
            <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
            <div className="bg-black bg-opacity-30 inline-block px-6 py-3 rounded-lg">
              <p className="text-lg">
                Trusted by <span className="font-bold">10 Lakh+</span> satisfied customers
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">All Products</h2>
          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Card
                  key={product.productId}
                  className="bg-white hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="relative h-48 mb-4">
                      <Image
                        src={getRandomImage(product.productId)}
                        alt={product.productName}
                        fill
                        unoptimized // skip Next.js image domain checks
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <CardTitle>{product.productName}</CardTitle>
                    <CardDescription>{product.productDescription}</CardDescription>
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
                          onClick={() => addToCart(product)}
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
            <p className="text-center text-gray-600">No products available.</p>
          )}
        </div>

        {/* Featured Section */}
        <div className="max-w-7xl mx-auto px-4 mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">
            Featured Combos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Ultimate Hair Care Combo',
                price: '₹899',
                originalPrice: '₹1199',
                image: '/combo.jpg',
              },
              {
                name: 'Skin Glow Package',
                price: '₹749',
                originalPrice: '₹999',
                image: '/product.png',
              },
              {
                name: 'Wellness Starter Kit',
                price: '₹1299',
                originalPrice: '₹1599',
                image: '/combo.jpg',
              },
            ].map((product, index) => (
              <Card
                key={index}
                className="bg-white hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="relative h-48 mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                      SALE
                    </div>
                  </div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>
                    Complete solution for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-2xl font-bold text-[#2F674A]">
                        {product.price}
                      </span>
                      <span className="text-gray-500 line-through ml-2">
                        {product.originalPrice}
                      </span>
                    </div>
                  </div>
                  <ButtonDemo
                    label="Buy Now"
                    bgColor="green"
                    onClick={() => router.push('/cart')}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
