// ImageGallery.tsx
// A hero image with a thumbnail strip below.
// Uses useState to track which image is selected (same concept as your HeroSection).
// The key difference from your version: this one matches the Figma layout with
// a large main image and smaller clickable thumbnails below it.

"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  clinicName: string;
}

export function ImageGallery({ images, clinicName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="mt-6">
      {/* Main Image */}
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-gray-100">
        <img
          src={images[selectedIndex]}
          alt={`${clinicName} - Photo ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 mt-3">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
              index === selectedIndex
                ? "ring-2 ring-blue-600 ring-offset-2"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <img
              src={image}
              alt={`${clinicName} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
