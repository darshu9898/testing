import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';

const productCategories = [
  {
    id: 1,
    name: "Hair Care",
    description: "Natural Ayurvedic solutions for healthy hair",
    image: "/combo.jpg",
    products: [
      { id: 1, name: "Brahmi Hair Oil", price: "₹299", description: "Strengthens roots and prevents hair fall" },
      { id: 2, name: "Amla Shampoo", price: "₹199", description: "Natural cleanser with amla goodness" },
      { id: 3, name: "Neem Hair Mask", price: "₹249", description: "Deep conditioning treatment" }
    ]
  },
  {
    id: 2,
    name: "Skin Care",
    description: "Vedic skincare for natural glow",
    image: "/product.png",
    products: [
      { id: 4, name: "Turmeric Face Pack", price: "₹179", description: "Brightening and anti-inflammatory" },
      { id: 5, name: "Neem Face Wash", price: "₹149", description: "Purifying cleanser for acne-prone skin" },
      { id: 6, name: "Sandalwood Cream", price: "₹399", description: "Moisturizing and soothing" }
    ]
  },
  {
    id: 3,
    name: "Wellness",
    description: "Holistic health supplements",
    image: "/combo.jpg",
    products: [
      { id: 7, name: "Ashwagandha Capsules", price: "₹499", description: "Stress relief and energy boost" },
      { id: 8, name: "Triphala Powder", price: "₹189", description: "Digestive health and detox" },
      { id: 9, name: "Chyawanprash", price: "₹349", description: "Immunity booster with herbs" }
    ]
  },
  {
    id: 4,
    name: "Men's Care",
    description: "Specialized care for modern men",
    image: "/product.png",
    products: [
      { id: 10, name: "Beard Growth Oil", price: "₹279", description: "Natural beard nourishment" },
      { id: 11, name: "Charcoal Face Wash", price: "₹169", description: "Deep cleansing for men's skin" },
      { id: 12, name: "Energy Booster", price: "₹449", description: "Natural stamina enhancer" }
    ]
  }
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const router = useRouter();

  const addToCart = (product) => {
    setCart([...cart, product]);
    //hit api endpoints
    // you can add a notification here
  };

  return (
    <>
      <Head>
        <title>Products - Trivedam</title>
        <meta name="description" content="Discover our range of authentic Ayurvedic products" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#2F674A] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Products</h1>
            <p className="text-xl md:text-2xl mb-8">Ancient Wisdom, Modern Solutions</p>
            <div className="bg-black bg-opacity-30 inline-block px-6 py-3 rounded-lg">
              <p className="text-lg">Trusted by <span className="font-bold">10 Lakh+</span> satisfied customers</p>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Product Categories</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {productCategories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white border-2 hover:border-[#2F674A]"
                onClick={() => setSelectedCategory(category)}
              >
                <CardHeader>
                  <div className="relative h-48 mb-4">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <CardTitle className="text-[#2F674A]">{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ButtonDemo
                    label="View Products"
                    bgColor="green"
                    onClick={() => setSelectedCategory(category)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Category Products */}
          {selectedCategory && (
            <div className="bg-[#F8F0E1] rounded-lg p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-black">{selectedCategory.name} Products</h3>
                <ButtonDemo
                  label="Back to Categories"
                  bgColor="black"
                  onClick={() => setSelectedCategory(null)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.products.map((product) => (
                  <Card key={product.id} className="bg-white hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="relative h-40 mb-4">
                        <Image
                          src={selectedCategory.image}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-[#2F674A]">{product.price}</span>
                        <ButtonDemo
                          label="Add to Cart"
                          bgColor="green"
                          onClick={() => addToCart(product)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Featured Products Section */}
          {!selectedCategory && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-12 text-black">Featured Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { name: "Ultimate Hair Care Combo", price: "₹899", originalPrice: "₹1199", image: "/combo.jpg" },
                  { name: "Skin Glow Package", price: "₹749", originalPrice: "₹999", image: "/product.png" },
                  { name: "Wellness Starter Kit", price: "₹1299", originalPrice: "₹1599", image: "/combo.jpg" }
                ].map((product, index) => (
                  <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
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
                      <CardDescription>Complete solution for your needs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="text-2xl font-bold text-[#2F674A]">{product.price}</span>
                          <span className="text-gray-500 line-through ml-2">{product.originalPrice}</span>
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
          )}
        </div>

        {/* Footer section */}
       
      </div>
    </>
  )
}