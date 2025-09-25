import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditions() {
  return (
    <>
      <Head>
        <title>Terms & Conditions - Trivedam Ayurveda</title>
        <meta name="description" content="Terms & Conditions for using Trivedam Ayurveda website and services" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#2F674A]">
                Terms & Conditions
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700">

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using our website, you agree to comply with and be bound by these Terms & Conditions. 
                If you do not agree, you may not use our website or services.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">2. Eligibility</h2>
              <p>
                You must be at least 18 years old to use our website or purchase products. 
                By using our services, you represent that you meet this requirement.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">3. Use of Website</h2>
              <ul className="list-disc pl-6 mb-6">
                <li>You agree not to misuse our website or interfere with its functionality.</li>
                <li>All content, images, and materials are owned by Trivedam Ayurveda and protected by copyright laws.</li>
                <li>You may not copy, distribute, or exploit our content without permission.</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">4. Product Information</h2>
              <p>
                We make every effort to ensure that product descriptions, images, and pricing are accurate. 
                However, errors may occur, and we reserve the right to correct them without prior notice.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">5. Limitation of Liability</h2>
              <p>
                Trivedam Ayurveda is not responsible for any indirect, incidental, or consequential damages 
                resulting from the use of our website or products. Our liability is limited to the value of 
                the product purchased.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">6. Governing Law</h2>
              <p>
                These Terms & Conditions are governed by the laws of India. Any disputes will be subject to 
                the jurisdiction of courts in [Your City], India.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">7. Contact Us</h2>
              <p>
                If you have questions about these Terms & Conditions:
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
