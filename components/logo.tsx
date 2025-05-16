"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center group">
      <div className="text-neon-cyan font-heading relative">
        <svg width="140" height="30" viewBox="0 0 140 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* P */}
          <path
            d="M12 4H6V25H12C16 25 19 22 19 18C19 14 16 11 12 11H6M12 4V11"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* A */}
          <path
            d="M25 25L31 4H37L43 25H38L36 19H32L30 25H25ZM34 15H34.5L35.5 11L36.5 15H34Z"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* T */}
          <path
            d="M45 4H55M50 4V25"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* C */}
          <path
            d="M57 18C57 14 60 11 64 11C68 11 71 14 71 18C71 22 68 25 64 25C60 25 57 22 57 18Z"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* H */}
          <path
            d="M75 4V25M75 14H82M82 4V25"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* L */}
          <path
            d="M84 4V25H91"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* I */}
          <path
            d="M93 4H100M93 25H100M96.5 4V25"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* N */}
          <path
            d="M102 25L108 4H114L120 25H115L113 19H109L107 25H102ZM110 15H110.5L111.5 11L112.5 15H110Z"
            stroke="#00EAFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* E */}
          <path
            d="M122 4H132M122 4V25H132M122 14H130"
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
          MUSIC
        </span>
        <span className="text-neon-cyan font-heading text-[0.5rem] leading-tight tracking-wider font-medium">AI</span>
        <span className="text-neon-cyan font-heading text-[0.5rem] leading-tight tracking-wider font-medium">OS</span>
      </div>
    </Link>
  )
}
