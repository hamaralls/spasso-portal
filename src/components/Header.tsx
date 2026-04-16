'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

const REGIAO = [
  { name: 'Hortolândia', href: '/sp/hortolandia/' },
  { name: 'Nova Odessa', href: '/sp/nova-odessa/' },
  { name: 'Campinas', href: '/sp/campinas/' },
  { name: 'Paulínia', href: '/sp/paulinia/' },
  { name: 'Monte Mor', href: '/sp/monte-mor/' },
  { name: 'Sta. Bárbara d\'Oeste', href: '/sp/santa-barbara-doeste/' },
  { name: 'RMC', href: '/rmc/' },
]

const TEMAS = [
  { name: 'Saúde', href: '/saude/' },
  { name: 'Esporte', href: '/esporte/' },
  { name: 'Educação', href: '/educacao/' },
  { name: 'Meio Ambiente', href: '/meio-ambiente/' },
  { name: 'Política', href: '/politica/' },
  { name: 'Tecnologia', href: '/tecnologia/' },
  { name: 'Economia', href: '/economia/' },
  { name: 'Eventos', href: '/eventos/' },
  { name: 'Cultura e Lazer', href: '/cultura-e-lazer/' },
  { name: 'Empregos', href: '/empregos/' },
  { name: 'Estilo de Vida', href: '/estilo-de-vida/' },
]

function Dropdown({ label, items, cols = 1 }: {
  label: string
  items: { name: string; href: string }[]
  cols?: 1 | 2
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-white text-sm font-semibold uppercase tracking-wide hover:text-white/80 transition-colors py-1"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-2 z-50 min-w-[160px] ${
            cols === 2 ? 'grid grid-cols-2 gap-x-2 w-[320px]' : ''
          }`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#dd8500]/10 hover:text-[#dd8500] font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-[#dd8500] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="text-white font-extrabold text-xl tracking-tight shrink-0">
            SPASSO CIDADES
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5">
            <Link href="/sp/sumare/" className="text-white text-sm font-semibold uppercase tracking-wide hover:text-white/80 transition-colors">
              Sumaré
            </Link>
            <Dropdown label="Região" items={REGIAO} />
            <Link href="/brasil/" className="text-white text-sm font-semibold uppercase tracking-wide hover:text-white/80 transition-colors">
              Brasil
            </Link>
            <Dropdown label="Temas" items={TEMAS} cols={2} />
            <Link href="/opiniao/" className="text-white text-sm font-semibold uppercase tracking-wide hover:text-white/80 transition-colors">
              Opinião
            </Link>
            <Link href="/edicao-impressa/" className="text-white text-sm font-semibold uppercase tracking-wide hover:text-white/80 transition-colors">
              Ed. Impressa
            </Link>
            <Link
              href="/anuncie/"
              className="text-white text-sm font-semibold uppercase tracking-wide border border-white/60 rounded px-3 py-1 hover:bg-white hover:text-[#dd8500] transition-colors"
            >
              Anuncie
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-1"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#c87800] border-t border-white/20 px-4 py-3 space-y-1">
          <MobileLink href="/sp/sumare/" onClick={() => setMobileOpen(false)}>Sumaré</MobileLink>
          <div className="pt-1 pb-1">
            <p className="text-white/60 text-xs uppercase font-bold px-2 pb-1">Região</p>
            {REGIAO.map((item) => (
              <MobileLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)} sub>
                {item.name}
              </MobileLink>
            ))}
          </div>
          <MobileLink href="/brasil/" onClick={() => setMobileOpen(false)}>Brasil</MobileLink>
          <div className="pt-1 pb-1">
            <p className="text-white/60 text-xs uppercase font-bold px-2 pb-1">Temas</p>
            <div className="grid grid-cols-2">
              {TEMAS.map((item) => (
                <MobileLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)} sub>
                  {item.name}
                </MobileLink>
              ))}
            </div>
          </div>
          <MobileLink href="/opiniao/" onClick={() => setMobileOpen(false)}>Opinião</MobileLink>
          <MobileLink href="/edicao-impressa/" onClick={() => setMobileOpen(false)}>Ed. Impressa</MobileLink>
          <MobileLink href="/anuncie/" onClick={() => setMobileOpen(false)}>Anuncie</MobileLink>
        </div>
      )}
    </header>
  )
}

function MobileLink({ href, children, onClick, sub }: {
  href: string
  children: React.ReactNode
  onClick: () => void
  sub?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-2 py-2 text-white font-semibold rounded hover:bg-white/10 transition-colors ${
        sub ? 'text-sm pl-4 text-white/90' : 'text-sm uppercase tracking-wide'
      }`}
    >
      {children}
    </Link>
  )
}
