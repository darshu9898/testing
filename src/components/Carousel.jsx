'use client';

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

export function MyCarousel() {
  const images = [
    '/combo.jpg',
    '/product.png',
    '/combo.jpg',
    '/combo.jpg',
    '/combo.jpg',
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollTo = (index) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  };

  const scrollPrev = () => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  };

  // Keyboard event handler for arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        scrollNext();
      }
    };

    // Attach event listener only on desktop (optional)
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [emblaApi]);

  return (
    <div className="bg-[#2F674A] md:pl-10 md:pr-10">
      <div
        className="relative max-w-3xl mx-auto overflow-hidden"
        ref={emblaRef}
        tabIndex={0} // Make div focusable for accessibility (optional)
      >
        <div className="flex">
          {images.map((img, index) => (
            <div key={index} className="min-w-full p-1">
            <Image
              alt={`Slide ${index + 1}`}
              src={img}
              width={400}
              height={700}
              className="w-full h-auto md:h-[360px] rounded-md object-contain"
              style={{ objectFit: 'contain' }}
            />

            </div>
          ))}
        </div>

        {/* Left arrow - only visible on md+ */}
        {/* Left arrow */}
        {/* Left arrow */}
        <button
          onClick={scrollPrev}
          aria-label="Previous Slide"
          className="hidden md:flex absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-[#232221] text-white rounded-full w-10 h-10 items-center justify-center z-10 cursor-pointer transition-colors duration-300 ease-in-out"
        >
          ‹
        </button>

        {/* Right arrow */}
        <button
          onClick={scrollNext}
          aria-label="Next Slide"
          className="hidden md:flex absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 hover:bg-[#232221] text-white rounded-full w-10 h-10 items-center justify-center z-10 cursor-pointer transition-colors duration-300 ease-in-out"
        >
          ›
        </button>
        
        {/* Dots container */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2  bg-opacity-40 px-3 py-1 rounded-full">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                selectedIndex === index ? "bg-white" : "bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
