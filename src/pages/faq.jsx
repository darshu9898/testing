import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import { useState } from 'react';

const faqData = [
  {
    category: "Products & Ingredients",
    questions: [
      {
        question: "Are your products 100% natural?",
        answer: "Yes, all Trivedam products are made with 100% natural Ayurvedic ingredients. We source our herbs and ingredients from certified organic farms and follow traditional Ayurvedic formulations passed down through generations."
      },
      {
        question: "How do I know which product is right for me?",
        answer: "Each product comes with detailed descriptions and recommended usage. You can also take our online Ayurvedic consultation quiz or contact our experts for personalized recommendations based on your dosha and specific needs."
      },
      {
        question: "Do your products have any side effects?",
        answer: "Our products are made from natural ingredients and are generally safe for most people. However, we recommend doing a patch test for skin products and consulting with a healthcare provider if you have specific allergies or medical conditions."
      },
      {
        question: "How long do your products last?",
        answer: "Most of our products have a shelf life of 2-3 years when stored properly. Each product has an expiry date printed on the packaging. Store in a cool, dry place away from direct sunlight for best results."
      }
    ]
  },
  {
    category: "Orders & Shipping",
    questions: [
      {
        question: "How long does shipping take?",
        answer: "We offer fast delivery across India. Metro cities receive orders within 2-3 business days, while other locations may take 4-7 business days. We also offer express delivery options for urgent orders."
      },
      {
        question: "Do you ship internationally?",
        answer: "Currently, we ship only within India. However, we're working on expanding our services internationally. Subscribe to our newsletter to be notified when international shipping becomes available."
      },
      {
        question: "What are the shipping charges?",
        answer: "We offer free shipping on orders above ₹499. For orders below ₹499, shipping charges vary by location, typically ranging from ₹50-₹150. Express delivery may have additional charges."
      },
      {
        question: "Can I track my order?",
        answer: "Yes! Once your order is shipped, you'll receive a tracking number via SMS and email. You can track your order status on our website or through the courier partner's tracking system."
      }
    ]
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for unopened products. If you're not satisfied with your purchase, you can return it within 30 days of delivery for a full refund or exchange."
      },
      {
        question: "How do I return a product?",
        answer: "Contact our customer service team with your order number. We'll guide you through the return process and may arrange for pickup depending on your location. Return shipping is free for defective or wrong products."
      },
      {
        question: "When will I receive my refund?",
        answer: "Refunds are processed within 5-7 business days after we receive your returned item. The amount will be credited back to your original payment method."
      },
      {
        question: "Can I exchange a product?",
        answer: "Yes, you can exchange products within 30 days if you're not satisfied with your choice. The product should be unopened and in original packaging. Exchange shipping charges may apply."
      }
    ]
  },
  {
    category: "Payment & Security",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, digital wallets, and cash on delivery (COD) for eligible locations."
      },
      {
        question: "Is my payment information secure?",
        answer: "Absolutely! We use industry-standard SSL encryption to protect your payment information. We're PCI DSS compliant and never store your card details on our servers."
      },
      {
        question: "Can I cancel my order?",
        answer: "You can cancel your order within 1 hour of placing it if it hasn't been processed for shipping. After that, you can use our return policy once you receive the product."
      },
      {
        question: "Do you offer EMI options?",
        answer: "Yes, we offer EMI options through major banks and financial partners for orders above ₹2,999. You can choose from 3, 6, 9, or 12-month EMI plans during checkout."
      }
    ]
  },
  {
    category: "Ayurveda & Usage",
    questions: [
      {
        question: "What is Ayurveda?",
        answer: "Ayurveda is an ancient Indian system of medicine that focuses on balancing the mind, body, and spirit through natural remedies, lifestyle practices, and dietary guidelines. It's based on the principle of three doshas: Vata, Pitta, and Kapha."
      },
      {
        question: "How do I determine my dosha type?",
        answer: "Your dosha is determined by your physical characteristics, mental tendencies, and lifestyle preferences. We offer a free online dosha assessment quiz on our website, or you can consult with our Ayurvedic experts."
      },
      {
        question: "Can I use multiple Ayurvedic products together?",
        answer: "Yes, most Ayurvedic products can be used together. However, we recommend consulting our experts for the best combination based on your specific needs and dosha type to maximize benefits."
      },
      {
        question: "How long does it take to see results?",
        answer: "Ayurvedic products work gradually to restore natural balance. You may see initial results within 2-4 weeks of consistent use, with significant improvements typically visible after 8-12 weeks of regular usage."
      }
    ]
  }
];

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState("Products & Ingredients");
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <Head>
        <title>FAQ - Frequently Asked Questions | Trivedam</title>
        <meta name="description" content="Find answers to common questions about Trivedam Ayurvedic products, shipping, returns, and more" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#2F674A] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl md:text-2xl mb-8">Find quick answers to common questions</p>
            <div className="bg-black bg-opacity-30 inline-block px-6 py-3 rounded-lg">
              <p className="text-lg">Still have questions? <span className="font-bold">Contact us</span> anytime</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#2F674A] focus:border-transparent placeholder-gray-500"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <span className="text-xl">🔍</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Category Sidebar */}
            <div className="lg:w-1/4">
              <Card className="bg-white sticky top-8">
                <CardHeader>
                  <CardTitle className="text-[#2F674A]">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {faqData.map((category) => (
                      <button
                        key={category.category}
                        onClick={() => setActiveCategory(category.category)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          activeCategory === category.category
                            ? "bg-[#2F674A] text-white"
                            : "text-gray-700 hover:bg-[#F8F0E1]"
                        }`}
                      >
                        {category.category}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Content */}
            <div className="lg:w-3/4">
              {searchTerm ? (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-black">
                    Search Results for "{searchTerm}"
                  </h2>
                  {filteredFAQs.length === 0 ? (
                    <Card className="bg-gray-50">
                      <CardContent className="p-8 text-center">
                        <div className="text-6xl mb-4">🤔</div>
                        <h3 className="text-xl font-bold mb-2">No results found</h3>
                        <p className="text-gray-600 mb-4">
                          We couldn't find any questions matching your search. Try different keywords or browse categories.
                        </p>
                        <ButtonDemo 
                          label="Contact Support" 
                          bgColor="green" 
                          onClick={() => window.location.href = '/contact'} 
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {filteredFAQs.map((category) => (
                        <div key={category.category}>
                          <h3 className="text-lg font-bold mb-4 text-[#2F674A]">{category.category}</h3>
                          {category.questions.map((faq, qIndex) => (
                            <Card key={qIndex} className="mb-4 bg-white hover:shadow-lg transition-shadow">
                              <CardContent className="p-0">
                                <button
                                  onClick={() => toggleQuestion(`${category.category}-${qIndex}`)}
                                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50"
                                >
                                  <span className="font-semibold text-black pr-4">{faq.question}</span>
                                  <span className="text-[#2F674A] text-2xl flex-shrink-0">
                                    {openQuestion === `${category.category}-${qIndex}` ? "−" : "+"}
                                  </span>
                                </button>
                                {openQuestion === `${category.category}-${qIndex}` && (
                                  <div className="px-6 pb-6">
                                    <div className="border-t pt-4">
                                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-black">{activeCategory}</h2>
                  <div className="space-y-4">
                    {faqData
                      .find(cat => cat.category === activeCategory)
                      ?.questions.map((faq, index) => (
                        <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <button
                              onClick={() => toggleQuestion(index)}
                              className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50"
                            >
                              <span className="font-semibold text-black pr-4">{faq.question}</span>
                              <span className="text-[#2F674A] text-2xl flex-shrink-0">
                                {openQuestion === index ? "−" : "+"}
                              </span>
                            </button>
                            {openQuestion === index && (
                              <div className="px-6 pb-6">
                                <div className="border-t pt-4">
                                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="mt-16 bg-[#2F674A] text-white rounded-lg p-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-xl mb-8 opacity-90">
                Can't find the answer you're looking for? Our friendly support team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ButtonDemo 
                  label="Contact Support" 
                  bgColor="white" 
                  onClick={() => window.location.href = '/contact'} 
                />
                <ButtonDemo 
                  label="Call Us: 1800-123-4567" 
                  bgColor="black" a
                  onClick={() => window.open('tel:18001234567')} 
                />
              </div>
              <p className="mt-6 text-sm opacity-75">
                Available Monday-Saturday 9 AM to 8 PM | Emergency support 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
