"use client"

import type React from "react"

import { useEffect, useRef } from "react"

interface SoundEffectsProps {
  children: React.ReactNode
}

export function SoundEffects({ children }: SoundEffectsProps) {
  const tapSoundRef = useRef<HTMLAudioElement | null>(null)
  const successSoundRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    // Create audio elements
    tapSoundRef.current = new Audio("/sounds/tap.mp3")
    successSoundRef.current = new Audio("/sounds/success.mp3")
    
    // Set volume
    if (tapSoundRef.current) tapSoundRef.current.volume = 0.2
    if (successSoundRef.current) successSoundRef.current.volume = 0.3
