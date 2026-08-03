"use client"

import { useEffect, useState } from "react"

const FRAME_COUNTS = { idle: 6, happy: 5, sad: 8 } as const

export type PetMood = keyof typeof FRAME_COUNTS

const FRAME_MS = 160

export function petMoodFromReturn(totalReturnPct: number): PetMood {
  if (totalReturnPct > 0) return "happy"
  if (totalReturnPct < 0) return "sad"
  return "idle"
}

function AnimatedFrames({
  mood,
  size,
  className,
}: {
  mood: PetMood
  size: number
  className?: string
}) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const frameCount = FRAME_COUNTS[mood]
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount)
    }, FRAME_MS)
    return () => clearInterval(id)
  }, [mood])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/daodun/${mood}_${frame}.png`}
      alt=""
      width={200}
      height={200}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className={className}
    />
  )
}

export function PetSprite({
  mood,
  size = 64,
  className,
}: {
  mood: PetMood
  size?: number
  className?: string
}) {
  // Remounting on mood change (via key) restarts the frame count at 0
  // instead of resetting state imperatively inside the animation effect.
  return <AnimatedFrames key={mood} mood={mood} size={size} className={className} />
}
