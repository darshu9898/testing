import { FaWhatsapp, FaInstagram, FaFacebook, FaShieldAlt } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-0">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:justify-between gap-10">
        
        {/* Left Section - Brand */}
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold mb-2">Trivedam</h2>
          <p className="text-lg opacity-90">Ayurvedic Wellness for Better Health</p>
        </div>
        
        {/* Middle Section - Links & Contact */}
        <div className="flex flex-col md:flex-row gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-semibold mb-3">Contact</h3>
            <p>
              <a href="tel:+919876543210" className="hover:text-gray-300 block">
                📞 +91 9821045611
              </a>
              <a href="mailto:support@libidopro.com" className="hover:text-gray-300 block">
                ✉ support@trivedamayurveda.com
              </a>
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Quick Links</h3>
            <p>
              <a href="/privacy-policy" className="hover:text-gray-300 block">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-gray-300 block">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
        
        {/* Right Section - Social & Security */}
        <div className="text-center md:text-right">
          <h3 className="text-xl font-semibold mb-3">Follow Us</h3>
          <div className="flex justify-center md:justify-end gap-4 text-2xl mb-4">
            <a href="https://wa.me/9821045611" className="hover:text-gray-300">
              <FaWhatsapp />
            </a>
            <a href="https://www.instagram.com/trivedamayurveda/?igsh=MWFmeHhhdTFvd3V5cg%3D%3D" className="hover:text-gray-300">
              <FaInstagram />
            </a>
            <a href="https://www.facebook.com/people/Trivedam-Ayurveda/61578979437324/?rdid=ynqSh4QWci7Kx5Tf&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16Fv2yMoy2%2F" className="hover:text-gray-300">
              <FaFacebook />
            </a>
          </div>
          <div className="flex justify-center md:justify-end items-center gap-2 opacity-80">
            <FaShieldAlt />
            <span>100% Secure Payments</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="text-center text-sm mt-8 opacity-80">
        © {new Date().getFullYear()} Trivedam. All rights reserved.
      </div>
    </footer>
  );
}
