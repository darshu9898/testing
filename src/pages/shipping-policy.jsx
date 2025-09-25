import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShippingPolicy() {
  return (
    <>
      <Head>
        <title>Shipping & Delivery Policy - Trivedam Ayurveda</title>
        <meta name="description" content="Shipping & Delivery Policy for Trivedam Ayurveda products" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#2F674A]">
                Shipping & Delivery Policy
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700">

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">1. Shipping Locations</h2>
              <p>
                We currently ship across India. International shipping is not available at this time.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">2. Delivery Time</h2>
              <p>
                Orders are typically processed within 1–2 business days. Delivery takes 5–7 business days 
                depending on the location.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">3. Shipping Charges</h2>
              <p>
                Standard shipping charges apply and will be displayed at checkout. 
                Free shipping may be offered on orders above a certain value.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">4. Delays</h2>
              <p>
                While we make every effort to deliver on time, delays may occur due to unforeseen 
                circumstances (weather, courier issues, etc.). We appreciate your patience in such cases.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">5. Contact Us</h2>
              <p>
                For shipping and delivery related queries:
              </p>
              <p><strong>Email:</strong> support@trivedamayurveda.com</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> Trivedam Ayurveda Private Limited, [Your Business Address], India</p>

            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
