import Image from 'next/image'

type Format = 'leaderboard' | 'rectangle'

// Campanha vigente (Maio Amarelo — Prefeitura de Sumaré, mai/2026).
// Pra trocar a campanha, basta substituir os PNGs em public/anuncios/.
const ADS: Record<Format, { src: string; width: number; height: number; alt: string }> = {
  leaderboard: {
    src: '/anuncios/leaderboard.png',
    width: 728,
    height: 110,
    alt: 'Maio Amarelo — Desacelere, seu bem maior é a vida. SMMUR / Prefeitura de Sumaré',
  },
  rectangle: {
    src: '/anuncios/rectangle.png',
    width: 300,
    height: 250,
    alt: 'Maio Amarelo — Desacelere, seu bem maior é a vida. SMMUR / Prefeitura de Sumaré',
  },
}

interface HouseAdProps {
  format: Format
  className?: string
}

export function HouseAd({ format, className }: HouseAdProps) {
  const ad = ADS[format]
  return (
    <div className={className}>
      <Image
        src={ad.src}
        alt={ad.alt}
        width={ad.width}
        height={ad.height}
        className="max-w-full h-auto mx-auto"
      />
    </div>
  )
}
