import Carousel, { MyCarousel } from '@/components/Carousel';
import Navbar from '@/components/NavBar';
import Head from 'next/head';
import Image from 'next/image';


export default function Home() {
  return (
    <>
      <Navbar />
      <div className='pt-16' />
      <MyCarousel />
      
    </>
  )
}
