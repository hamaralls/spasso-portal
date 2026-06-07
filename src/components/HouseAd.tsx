'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export type AdFormat = 'leaderboard' | 'rectangle'

const ADS: Record<AdFormat, { src: string; width: number; height: number; alt: string }> = {
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

export type RemoteAd = {
  id: string
  name: string
  image_url: string
  link_url: string | null
  slot: string
}

type HouseAdApiResponse = {
  ad: RemoteAd | null
}

interface HouseAdProps {
  format: AdFormat
  slot?: string
  className?: string
  fallback?: boolean
}

interface HouseAdCreativeProps {
  ad: RemoteAd | null
  format: AdFormat
}

export async function fetchHouseAd(slot: string, fallbackSlot?: string | null): Promise<RemoteAd | null> {
  const params = new URLSearchParams({ slot })
  if (fallbackSlot) params.set('fallbackSlot', fallbackSlot)

  const res = await fetch(`/api/house-ads?${params.toString()}`)
  if (!res.ok) return null
  const json = (await res.json()) as HouseAdApiResponse
  return json.ad ?? null
}

export function HouseAdCreative({ ad, format }: HouseAdCreativeProps) {
  const fallbackImage = ADS[format]
  const img = ad ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.image_url}
      alt={ad.name}
      className="mx-auto h-auto max-h-[600px] max-w-full object-contain"
    />
  ) : (
    <Image
      src={fallbackImage.src}
      alt={fallbackImage.alt}
      width={fallbackImage.width}
      height={fallbackImage.height}
      className="mx-auto h-auto max-w-full"
    />
  )

  return ad?.link_url ? (
    <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  )
}

export function HouseAd({ format, slot, className, fallback = true }: HouseAdProps) {
  const [ad, setAd] = useState<RemoteAd | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!slot) {
      setLoaded(true)
      return
    }

    let alive = true
    setLoaded(false)
    fetchHouseAd(slot)
      .then((nextAd) => {
        if (alive) setAd(nextAd)
      })
      .catch(() => {
        if (alive) setAd(null)
      })
      .finally(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [slot])

  if (!loaded) return <div className={className} aria-hidden />
  if (!ad && !fallback) return null

  return (
    <div className={className}>
      <HouseAdCreative ad={ad} format={format} />
    </div>
  )
}
