'use client';

import React from "react";
import Image from "next/image";

import {
  Carousel as UiCarousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function MyCarousel() {
  const images = [
    '/combo.jpg',
    '/product.png',
    '/combo.jpg',
    '/combo.jpg',
    '/combo.jpg',
  ];

  return (
    <div className="pl-4 md:pl-20 bg-[#2F674A]">
      <UiCarousel className="w-full max-w-md mx-auto">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Image
                  alt="box"
                  src={img}
                  width={400}
                  height={700}
                  className="w-full h-auto object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </UiCarousel>
    </div>
  );
}
