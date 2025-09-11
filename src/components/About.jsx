import Image from 'next/image'
import React from 'react'
import { Card, CardContent } from './ui/card'
import { ButtonDemo } from './Button'

const About = () => {
  const features = [
    {
      icon: "🌿",
      title: "100% Natural",
      description: "Pure Ayurvedic ingredients sourced from certified organic farms"
    },
    {
      icon: "🧪",
      title: "Lab Tested",
      description: "Every product is rigorously tested for purity and potency"
    },
    {
      icon: "📜",
      title: "Ancient Wisdom",
      description: "Formulations based on 5000-year-old Vedic knowledge"
    },
    {
      icon: "🏆",
      title: "Award Winning",
      description: "Recognized for excellence in Ayurvedic healthcare"
    }
  ];

  return (
    <>
      <div className="bg-[#F8F0E1] py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">About Trivedam</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Bridging ancient Ayurvedic wisdom with modern wellness needs, 
              bringing you authentic solutions for holistic health.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Image Section */}
            <div className="relative">
              <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  alt="Trivedam Ayurvedic Products"
                  src="/combo.jpg"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              
              {/* Floating Stats Card */}
              {/* <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2F674A]">10L+</p>
                  <p className="text-gray-600 text-sm">Happy Customers</p>
                </div>
              </div> */}
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-black mb-4">Our Story</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Founded with a mission to make authentic Ayurveda accessible to modern India, 
                  Trivedam combines traditional wisdom with contemporary convenience. Our journey 
                  began with a simple belief: nature holds the answers to our wellness needs.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Every product is carefully crafted using time-tested formulations from ancient 
                  Vedic texts, ensuring you receive the purest and most effective natural solutions 
                  for your health and wellness journey.
                </p>
              </div>

              <div className="bg-[#2F674A] text-white p-6 rounded-xl">
                <h4 className="text-lg font-bold mb-2">Our Promise</h4>
                <p className="text-sm opacity-90">
                  "To deliver authentic Ayurvedic products that honor tradition while meeting 
                  the highest standards of quality and safety for modern lifestyles."
                </p>
              </div>

              <div className="flex gap-4">
                <ButtonDemo label="Our Products" bgColor="green" onClick={() => window.location.href = '/products'} />
                <ButtonDemo label="Contact Us" bgColor="black" onClick={() => window.location.href = '/contact'} />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-bold text-lg text-black mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-[#2F674A] to-[#1a3d2e] text-white">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  To make authentic Ayurvedic wellness accessible to every Indian household, 
                  combining ancient wisdom with modern quality standards to create products 
                  that truly make a difference in people's lives.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🔮</div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  To become India's most trusted Ayurvedic brand, leading the global revival 
                  of traditional medicine and helping millions achieve optimal health through 
                  nature's bounty.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values Section */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-black mb-8">Our Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-16 h-16 bg-[#2F674A] text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  🤝
                </div>
                <h4 className="font-bold text-lg text-black mb-2">Authenticity</h4>
                <p className="text-gray-600 text-sm">
                  We stay true to traditional Ayurvedic principles while ensuring modern quality standards.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-[#2F674A] text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  🌱
                </div>
                <h4 className="font-bold text-lg text-black mb-2">Sustainability</h4>
                <p className="text-gray-600 text-sm">
                  We source responsibly and support farmers while protecting our environment for future generations.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-[#2F674A] text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  💎
                </div>
                <h4 className="font-bold text-lg text-black mb-2">Excellence</h4>
                <p className="text-gray-600 text-sm">
                  We pursue perfection in every aspect, from sourcing ingredients to customer service.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-center text-black mb-8">What Our Customers Say</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👨</span>
                </div>
                <p className="text-sm text-gray-600 italic mb-3">
                  "Trivedam products have transformed my daily routine. The quality is exceptional 
                  and I can feel the difference in my energy levels."
                </p>
                <p className="font-bold text-black">Rajesh Kumar</p>
                <p className="text-xs text-gray-500">Delhi</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
                <p className="text-sm text-gray-600 italic mb-3">
                  "As someone who values natural products, Trivedam has become my go-to brand. 
                  Their hair care range is simply amazing!"
                </p>
                <p className="font-bold text-black">Priya Sharma</p>
                <p className="text-xs text-gray-500">Mumbai</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👨</span>
                </div>
                <p className="text-sm text-gray-600 italic mb-3">
                  "Fast delivery, authentic products, and excellent customer service. 
                  Trivedam has exceeded all my expectations."
                </p>
                <p className="font-bold text-black">Amit Patel</p>
                <p className="text-xs text-gray-500">Bangalore</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-[#2F674A] to-[#1a3d2e] text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Join Our Wellness Journey</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Experience the power of authentic Ayurveda with our carefully crafted products. 
                Start your journey towards natural wellness today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ButtonDemo label="Shop Now" bgColor="white" onClick={() => window.location.href = '/products'} />
                <ButtonDemo label="Learn More" bgColor="black" onClick={() => window.location.href = '/faq'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default About
