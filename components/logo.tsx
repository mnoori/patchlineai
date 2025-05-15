"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center group">
      <div className="text-neon-cyan font-heading relative">
        <svg width="140" height="30" viewBox="0 0 140 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized ALGORYX text with modified A (no horizontal) and flipped R */}
          {/* Modified A - like a flipped V */}
          <path
            d="M12 4L6 25H18L15 15H9L12 4Z"
            fill="none"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* L */}
          <path d="M25 5V25H32" stroke="#00EAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* G */}
          <path
            d="M45 5C41 5 38 8 38 12.5C38 17 41 20 45 20C49 20 52 17 52 12.5V10H45M38 25V20"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* O */}
          <path
            d="M65 5C61 5 58 8 58 12.5C58 17 61 20 65 20C69 20 72 17 72 12.5C72 8 69 5 65 5Z"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flipped R */}
          <path
            d="M85 5H78V25M78 15H85C87 15 89 13.5 89 11C89 8.5 87 7 85 7H78M85 15L92 25"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Y */}
          <path
            d="M98 5L105 15L112 5M105 15V25"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X */}
          <path
            d="M116 5L130 25M116 25L130 5"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-neon-cyan/0 blur-md rounded-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.3 }}
        />
      </div>
      <div className="border-[1px] border-neon-cyan/20 flex flex-col justify-center items-center px-2 py-1 ml-2 bg-neon-cyan/5 rounded-sm">
        <span className="text-neon-cyan font-heading text-[0.5rem] leading-tight tracking-wider font-medium">
          ART &
        </span>
        <span className="text-neon-cyan font-heading text-[0.5rem] leading-tight tracking-wider font-medium">TECH</span>
        <span className="text-neon-cyan font-heading text-[0.5rem] leading-tight tracking-wider font-medium">LAB</span>
      </div>
    </Link>
  )
}
