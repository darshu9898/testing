import About from '@/components/About';
import { ButtonDemo } from '@/components/Button';
import Carousel, { MyCarousel } from '@/components/Carousel';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  return (
    <>
      <Head>
        <title>Trivedam - Ayurvedic Wellness Products</title>
        <meta name="description" content="Inspired by Vedas, made for you. Trusted by 10 lakh+ Indian men." />
      </Head>
      
      <div className="pt-16" />
      
      <div className="flex flex-col md:flex-row mx-auto px-4 gap-8 items-center bg-[#2F674A]">
        {/* Left side text */}
        <div className="flex-1 text-white mt-8 md:mx-20 mx-2">
          <h2 className="font-bold mb-4 text-5xl">Inspired By VEDAS,</h2>
          <p className="mb-6 text-3xl">Made for You.</p>
          <div className="bg-gray-800 p-5 md:mr-80 mr-4">
            Trusted by <span className="font-bold">10 Lakhs+</span>
            <p className="font-bold">Indian Men</p>
          </div>

          <ButtonDemo
            label="Shop Now"
            bgColor="white"
            onClick={() => router.push('/products')}
          />
        </div>

        {/* Right side carousel */}
        <div className="flex-1 w-full md:w-auto">
          <MyCarousel />
        </div>
      </div>
      
      <About />
    </>
  );
}