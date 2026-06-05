'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Format = 'leaderboard' | 'rectangle'

const ADS: Record<Format, { src: string; width: number; height: number; alt: string }> = {
  leaderboard: {
    src: '/anuncios/leaderboard.png',
    width: 728,
    height: 110,
    alt: 'Anuncio proprio Spasso Cidades',
  },
  rectangle: {
    src: '/anuncios/rectangle.png',
    width: 300,
    height: 250,
    alt: 'Anuncio proprio Spasso Cidades',
  },
}

type RemoteAd = {
  id: string
  name: string
  image_url: string
  link_url: string | null
  slot: string
}

interface HouseAdProps {
  format: Format
  slot?: string
  className?: string
}

export function HouseAd({ format, slot, className }: HouseAdProps) {
  const fallback = ADS[format]
  const [ad, setAd] = useState<RemoteAd | null>(null)

  useEffect(() => {
    if (!slot) return
    let alive = true
    fetch(`/api/house-ads?slot=${encodeURIComponent(slot)}`)
      .then((res) => res.json())
      .then((json: { ad: RemoteAd | null }) => {
        if (alive) setAd(json.ad)
      })
      .catch(() => {
        if (alive) setAd(null)
      })
    return () => {
      alive = false
    }
  }, [slot])

  const image = ad
    ? { src: ad.image_url, alt: ad.name, width: fallback.width, height: fallback.height }
    : fallback
  const img = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className="max-w-full h-auto mx-auto"
      unoptimized={Boolean(ad)}
    />
  )

  return (
    <div className={className}>
      {ad?.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  )
}
