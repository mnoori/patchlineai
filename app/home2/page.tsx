'use client'

import { BrandGuidePage } from '@/components/generated-from-figma/BrandGuidePage'
import { Navbar } from '@/components/navbar'

export default function Home2() {
  return (
    <>
      <Navbar />
      {/* Full screen BrandGuidePage */}
      <div className="fixed inset-0 pt-16 bg-[#121212]">
        <BrandGuidePage 
          className="w-full h-full"
        />
      </div>
    </>
  )
} 