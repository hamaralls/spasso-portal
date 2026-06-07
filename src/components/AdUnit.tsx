'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { fetchHouseAd, HouseAdCreative, type RemoteAd } from './HouseAd'

declare global {
  interface Window {
    googletag: {
      cmd: Array<() => void>
      defineSlot: (path: string, size: number[][], div: string) => {
        addService: (service: unknown) => void
      }
      pubads: () => unknown
      enableServices: () => void
      display: (div: string) => void
    }
  }
}

type AdFormat = 'leaderboard' | 'rectangle'

interface AdUnitProps {
  slot: string
  format: AdFormat
  className?: string
  /** Shows the local fallback image when there is no local campaign or GAM. */
  houseAd?: boolean
}

const SIZES: Record<AdFormat, number[][]> = {
  leaderboard: [[728, 90], [320, 50]],
  rectangle: [[300, 250]],
}

const NETWORK_CODE = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

export function AdUnit({ slot, format, className, houseAd }: AdUnitProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const divId = `gpt-${slot}-${reactId}`
  const registeredSlot = useRef<string | null>(null)
  const [localAd, setLocalAd] = useState<RemoteAd | null>(null)
  const [localChecked, setLocalChecked] = useState(false)

  useEffect(() => {
    let alive = true
    setLocalAd(null)
    setLocalChecked(false)

    fetchHouseAd(slot)
      .then((ad) => {
        if (alive) setLocalAd(ad)
      })
      .catch(() => {
        if (alive) setLocalAd(null)
      })
      .finally(() => {
        if (alive) setLocalChecked(true)
      })

    return () => {
      alive = false
    }
  }, [slot])

  useEffect(() => {
    if (!localChecked || localAd || !NETWORK_CODE || registeredSlot.current === slot) return
    registeredSlot.current = slot

    window.googletag = window.googletag || { cmd: [] }
    window.googletag.cmd.push(() => {
      window.googletag
        .defineSlot(`/${NETWORK_CODE}/${slot}`, SIZES[format], divId)
        .addService(window.googletag.pubads())
      window.googletag.enableServices()
      window.googletag.display(divId)
    })
  }, [slot, format, divId, localAd, localChecked])

  if (!localChecked) {
    return <div className={className} aria-hidden />
  }

  if (localAd) {
    return (
      <div className={className}>
        <HouseAdCreative ad={localAd} format={format} />
      </div>
    )
  }

  if (!NETWORK_CODE) {
    return houseAd ? (
      <div className={className}>
        <HouseAdCreative ad={null} format={format} />
      </div>
    ) : null
  }

  return (
    <div className={className}>
      <div id={divId} />
    </div>
  )
}
