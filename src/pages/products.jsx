// src/pages/products/index.js
import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

const PRODUCTS_PER_PAGE = 12;

export async function getStaticProps() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`);
  const allProducts = await res.json();

  return {
    props: { allProducts },
    revalidate: 60, // regenerate page every 60 seconds
  };
}

export default function Products({ allProducts }) {
  const { addToCart } = useCart();
  const [page, setPage] = useState(1);

  const handleAddToCart = async (product, quantity = 1) => {
    try {
      const result = await addToCart(product.productId, quantity);
      if (result.action === 'created') alert(`✅ ${product.productName} added to cart`);
      else if (result.action === 'updated') alert(`✅ ${product.productName} quantity updated`);
      else if (result.action === 'exists') alert(`ℹ️ ${product.productName} already in cart`);
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const displayedProducts = allProducts.slice(0, page * PRODUCTS_PER_PAGE);

  return (
    <>
      <Head>
        <title>Products - Trivedam</title>
        <meta name="description" content="Discover our range of authentic Ayurvedic products" />
      </Head>

      <div className="pt-16 min-h-screen">
        <div className="bg-[#2F674A] text-white py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
          <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">All Products</h2>

          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-gray-900">
              {displayedProducts.map((product) => (
                <Card key={product.productId} className="bg-white hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="relative h-80 mb-4">
                      <Image
                        src={product.productImage}
                        alt={product.productName}
                        fill
                        className="object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                    <CardTitle>{product.productName}</CardTitle>
                    <CardDescription>{product.productDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-[#2F674A]">₹{product.productPrice}</span>
                      {product.productStock > 0 ? (
                        <ButtonDemo label="Add to Cart" bgColor="green" onClick={() => handleAddToCart(product)} />
                      ) : (
                        <span className="text-red-600 font-semibold">Out of Stock</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No products available.</p>
          )}

          {displayedProducts.length < allProducts.length && (
            <div className="text-center mt-8">
              <button
                className="px-6 py-3 bg-[#2F674A] text-white rounded-lg hover:bg-[#1f4a33] transition"
                onClick={() => setPage(page + 1)}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
