// pages/privacy-policy.jsx
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Trivedam Ayurveda</title>
        <meta name="description" content="Privacy Policy for Trivedam Ayurveda - How we collect, use, and protect your personal information" />
      </Head>
      
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-[#2F674A]">
                Privacy Policy
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700">
              
              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">1. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Information</h3>
              <p className="mb-4">
                When you create an account, place an order, or contact us, we may collect:
              </p>
              <ul className="mb-6 space-y-2">
                <li>• Name and contact information (email, phone number)</li>
                <li>• Shipping and billing addresses</li>
                <li>• Payment information (processed securely through Razorpay)</li>
                <li>• Order history and preferences</li>
                <li>• Account credentials and profile information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="mb-6 space-y-2">
                <li>• Device information (IP address, browser type, device type)</li>
                <li>• Website usage data and analytics</li>
                <li>• Cookies and similar tracking technologies</li>
                <li>• Location data (with your consent)</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="mb-6 space-y-2">
                <li>• Process and fulfill your orders</li>
                <li>• Provide customer service and support</li>
                <li>• Send order confirmations and shipping updates</li>
                <li>• Improve our products and services</li>
                <li>• Send marketing communications (with your consent)</li>
                <li>• Prevent fraud and ensure account security</li>
                <li>• Comply with legal obligations</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">3. Information Sharing</h2>
              <p className="mb-4">We may share your information with:</p>
              <ul className="mb-6 space-y-2">
                <li>• <strong>Service Providers:</strong> Payment processors (Razorpay), shipping companies, email services</li>
                <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li>• <strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mb-6">
                <strong>We never sell your personal information to third parties.</strong>
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">4. Data Security</h2>
              <p className="mb-4">We implement industry-standard security measures:</p>
              <ul className="mb-6 space-y-2">
                <li>• SSL encryption for all data transmission</li>
                <li>• Secure payment processing through Razorpay</li>
                <li>• Regular security audits and updates</li>
                <li>• Access controls and employee training</li>
                <li>• Data backup and disaster recovery procedures</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="mb-6 space-y-2">
                <li>• Access and review your personal information</li>
                <li>• Update or correct inaccurate information</li>
                <li>• Request deletion of your personal data</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Request data portability</li>
                <li>• Lodge complaints with data protection authorities</li>
              </ul>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">6. Cookies Policy</h2>
              <p className="mb-4">We use cookies to:</p>
              <ul className="mb-6 space-y-2">
                <li>• Remember your preferences and login status</li>
                <li>• Analyze website traffic and user behavior</li>
                <li>• Provide personalized content and recommendations</li>
                <li>• Enable shopping cart functionality</li>
              </ul>
              <p className="mb-6">
                You can control cookies through your browser settings.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">7. Data Retention</h2>
              <p className="mb-6">
                We retain your personal information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements. 
                Order information is typically retained for 7 years for tax and legal purposes.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">8. International Transfers</h2>
              <p className="mb-6">
                Your information may be transferred to and processed in countries other than India. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this policy.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">9. Children's Privacy</h2>
              <p className="mb-6">
                Our services are not intended for children under 18. We do not knowingly collect 
                personal information from children under 18. If you become aware that a child has 
                provided us with personal information, please contact us.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">10. Changes to This Policy</h2>
              <p className="mb-6">
                We may update this Privacy Policy periodically. We will notify you of significant 
                changes by email or through a notice on our website. Your continued use of our 
                services after changes constitutes acceptance of the updated policy.
              </p>

              <h2 className="text-2xl font-bold text-[#2F674A] mt-8 mb-4">11. Contact Us</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="mb-4">
                  If you have questions about this Privacy Policy or your personal information:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@trivedamayurveda.com</p>
                  <p><strong>Phone:</strong> +91 98765 43210</p>
                  <p><strong>Address:</strong> Trivedam Ayurveda Private Limited<br/>
                  [Your Business Address]<br/>
                  India</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This privacy policy is compliant with Indian data protection laws 
                  including the Information Technology Act, 2000 and the proposed Personal Data Protection Bill.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}