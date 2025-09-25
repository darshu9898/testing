import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RefundPolicy() {
  return (
    <>
      <Head>
        <title>Refund & Cancellation Policy - Trivedam Ayurveda</title>
        <meta name="description" content="Refund and Cancellation Policy for Trivedam Ayurveda orders" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#2F674A]">
                Refund & Cancellation Policy
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700">

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">1. Cancellations</h2>
              <p>
                Orders can be cancelled within 24 hours of purchase by contacting our support team. 
                Once the order is shipped, cancellations are not possible.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">2. Refunds</h2>
              <p>
                Refunds are applicable only in the following cases:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Products received are damaged or defective</li>
                <li>Wrong product delivered</li>
                <li>Order cancelled within 24 hours before shipping</li>
              </ul>
              <p>
                Refunds will be processed within 7–10 business days to the original payment method.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">3. Non-Refundable Items</h2>
              <p>
                Due to the nature of Ayurvedic consumable products, opened or used items 
                are not eligible for return or refund.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">4. Contact Us</h2>
              <p>
                For refunds or cancellations, please contact:
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
