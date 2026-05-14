'use client'

import { useEffect, useRef } from 'react'
import { HouseAd } from './HouseAd'

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
  /** Se true e GAM ainda não estiver configurado, renderiza a campanha vigente
   *  (HouseAd) em vez de null. Quando GAM ativar, GAM toma o lugar automaticamente. */
  houseAd?: boolean
}

const SIZES: Record<AdFormat, number[][]> = {
  leaderboard: [[728, 90], [320, 50]],
  rectangle: [[300, 250]],
}

const NETWORK_CODE = process.env.NEXT_PUBLIC_GAM_NETWORK_CODE

export function AdUnit({ slot, format, className, houseAd }: AdUnitProps) {
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

  if (!NETWORK_CODE) {
    return houseAd ? <HouseAd format={format} className={className} /> : null
  }

  return (
    <div className={className}>
      <div id={divId} />
    </div>
  )
}
