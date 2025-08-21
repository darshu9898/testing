import Navbar from '@/components/NavBar';
import { ButtonDemo } from '@/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Head from 'next/head';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // send data to backend from this point with api end points
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <>
      <Head>
        <title>Contact Us - Trivedam</title>
        <meta name="description" content="Get in touch with Trivedam for any queries about our Ayurvedic products" />
      </Head>
      
      <div className="pt-16 min-h-screen">
        {/* Hero Section */}
        <div className="bg-[#2F674A] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl md:text-2xl mb-8">We're here to help you on your wellness journey</p>
            <div className="bg-black bg-opacity-30 inline-block px-6 py-3 rounded-lg">
              <p className="text-lg">Available <span className="font-bold">24/7</span> for your support</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-black">Send us a Message</h2>
              
              {isSubmitted ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-8 text-center">
                    <div className="text-green-600 text-6xl mb-4">✓</div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
                    <p className="text-green-700">Your message has been sent successfully. We'll get back to you within 24 hours.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div>
                          <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2">
                            Subject *
                          </label>
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent"
                          >
                            <option value="">Select a subject</option>
                            <option value="product-inquiry">Product Inquiry</option>
                            <option value="order-support">Order Support</option>
                            <option value="general-question">General Question</option>
                            <option value="feedback">Feedback</option>
                            <option value="partnership">Partnership</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F674A] focus:border-transparent resize-vertical"
                          placeholder="Tell us how we can help you..."
                        />
                      </div>

                      <ButtonDemo
                        label="Send Message"
                        bgColor="green"
                        onClick={handleSubmit}
                      />
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-black">Get in Touch</h2>
              
              <div className="space-y-6 mb-8">
                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className="bg-[#2F674A] text-white p-3 rounded-lg">
                      <span className="text-xl">📍</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black mb-2">Our Address</h3>
                      <p className="text-gray-600">
                        123, Ayurveda Complex,<br />
                        Wellness Street, Health City,<br />
                        New Delhi - 110001, India
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className="bg-[#2F674A] text-white p-3 rounded-lg">
                      <span className="text-xl">📞</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black mb-2">Phone Numbers</h3>
                      <p className="text-gray-600">
                        Customer Care: +91 9876543210<br />
                        WhatsApp: +91 9876543211<br />
                        Toll-Free: 1800-123-4567
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className="bg-[#2F674A] text-white p-3 rounded-lg">
                      <span className="text-xl">✉️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black mb-2">Email Addresses</h3>
                      <p className="text-gray-600">
                        General: info@trivedam.com<br />
                        Support: support@trivedam.com<br />
                        Business: business@trivedam.com
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-start space-x-4">
                    <div className="bg-[#2F674A] text-white p-3 rounded-lg">
                      <span className="text-xl">⏰</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black mb-2">Business Hours</h3>
                      <p className="text-gray-600">
                        Monday - Saturday: 9:00 AM - 8:00 PM<br />
                        Sunday: 10:00 AM - 6:00 PM<br />
                        Emergency Support: 24/7
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Media */}
              <Card className="bg-[#2F674A] text-white">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all">
                      <span className="text-xl">📘</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all">
                      <span className="text-xl">📷</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all">
                      <span className="text-xl">🐦</span>
                    </button>
                    <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all">
                      <span className="text-xl">💼</span>
                    </button>
                  </div>
                  <p className="mt-4 text-sm opacity-90">Stay connected for updates, tips, and wellness content</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Quick Links */}
          <div className="mt-16 bg-[#F8F0E1] rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-black">Quick Help</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-[#2F674A] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">❓</span>
                </div>
                <h3 className="font-bold mb-2">Have Questions?</h3>
                <p className="text-gray-600 mb-4">Check our comprehensive FAQ section</p>
                <ButtonDemo label="View FAQ" bgColor="green" onClick={() => window.location.href = '/faq'} />
              </div>
             
              <div className="text-center">
                <div className="bg-[#2F674A] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">🔄</span>
                </div>
                <h3 className="font-bold mb-2">Returns & Refunds</h3>
                <p className="text-gray-600 mb-4">Easy return process within 30 days</p>
                <ButtonDemo label="Return Policy" bgColor="green" onClick={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}