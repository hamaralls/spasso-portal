'use client'

import { useEffect, useRef } from 'react'

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
}

const SIZES: Record<AdFormat, number[][]> = {
  leaderboard: [[728, 90], [320, 50]],
  rectangle: [[300, 250]],
}

const NETWORK_CODE = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

export function AdUnit({ slot, format, className }: AdUnitProps) {
  const divId = `gpt-${slot}`
  const registered = useRef(false)

  useEffect(() => {
    if (!NETWORK_CODE || registered.current) return
    registered.current = true

    window.googletag = window.googletag || { cmd: [] }
    window.googletag.cmd.push(() => {
      window.googletag
        .defineSlot(`/${NETWORK_CODE}/${slot}`, SIZES[format], divId)
        .addService(window.googletag.pubads())
      window.googletag.enableServices()
      window.googletag.display(divId)
    })
  }, [slot, format, divId])

  if (!NETWORK_CODE) return null

  return (
    <div className={className}>
      <div id={divId} />
    </div>
  )
}
