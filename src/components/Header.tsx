'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Menu, X, Search } from 'lucide-react'

const REGIAO = [
  { name: 'Hortolândia',           href: '/sp/hortolandia' },
  { name: 'Nova Odessa',           href: '/sp/nova-odessa' },
  { name: 'Campinas',              href: '/sp/campinas' },
  { name: 'Paulínia',              href: '/sp/paulinia' },
  { name: 'Monte Mor',             href: '/sp/monte-mor' },
  { name: "Sta. Bárbara d'Oeste",  href: '/sp/santa-barbara-doeste' },
  { name: 'RMC',                   href: '/rmc' },
]

const TEMAS = [
  { name: 'Saúde',           href: '/saude' },
  { name: 'Esporte',         href: '/esporte' },
  { name: 'Educação',        href: '/educacao' },
  { name: 'Meio Ambiente',   href: '/meio-ambiente' },
  { name: 'Política',        href: '/politica' },
  { name: 'Tecnologia',      href: '/tecnologia' },
  { name: 'Economia',        href: '/economia' },
  { name: 'Eventos',         href: '/eventos' },
  { name: 'Cultura e Lazer', href: '/cultura-e-lazer' },
  { name: 'Empregos',        href: '/empregos' },
  { name: 'Estilo de Vida',  href: '/estilo-de-vida' },
]

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function NavDropdown({ label, items, cols = 1 }: {
  label: string
  items: { name: string; href: string }[]
  cols?: 1 | 2
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[#1a1a1a] text-xs font-semibold uppercase tracking-wider hover:text-[#f5821f] transition-colors py-1"
      >
        {label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-2 bg-white shadow-xl rounded-lg py-2 z-50 border border-gray-100 min-w-[160px] ${
          cols === 2 ? 'grid grid-cols-2 gap-x-2 w-[320px]' : ''
        }`}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[#1a1a1a] hover:text-[#f5821f] hover:bg-gray-50 font-medium transition-colors"
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
    <header className="bg-white sticky top-0 z-50 shadow-sm">

      {/* ── Topo: data + logo grande centralizado + busca ── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative flex items-center justify-between py-3 lg:py-4">

          {/* Esquerda: data (desktop) / hamburger (mobile) */}
          <div className="w-32 lg:w-48 shrink-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-[#1a1a1a] p-1"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span className="hidden lg:block text-[11px] text-gray-400 leading-tight capitalize">
              {formatDate()}
            </span>
          </div>

          {/* Centro: logo grande */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png"
              alt="Spasso Cidades"
              width={480}
              height={96}
              priority
              className="h-16 lg:h-24 w-auto max-w-[200px] lg:max-w-[360px]"
            />
          </Link>

          {/* Direita: busca */}
          <div className="w-32 lg:w-48 shrink-0 flex justify-end">
            <Link href="/busca" aria-label="Buscar"
              className="text-gray-400 hover:text-[#f5821f] transition-colors p-1">
              <Search size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── NavBar branca (desktop) ── */}
      <nav className="hidden lg:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-6">
              <Link href="/sp/sumare"
                className="text-[#1a1a1a] text-xs font-semibold uppercase tracking-wider hover:text-[#f5821f] transition-colors">
                Sumaré
              </Link>
              <NavDropdown label="Região" items={REGIAO} />
              <Link href="/brasil"
                className="text-[#1a1a1a] text-xs font-semibold uppercase tracking-wider hover:text-[#f5821f] transition-colors">
                Brasil
              </Link>
              <NavDropdown label="Temas" items={TEMAS} cols={2} />
              <Link href="/colunistas"
                className="text-[#1a1a1a] text-xs font-semibold uppercase tracking-wider hover:text-[#f5821f] transition-colors">
                Colunistas
              </Link>
              <Link href="/edicao-impressa"
                className="text-[#1a1a1a] text-xs font-semibold uppercase tracking-wider hover:text-[#f5821f] transition-colors">
                Ed. Impressa
              </Link>
            </div>

            <Link
              href="/anuncie"
              className="text-xs font-bold uppercase tracking-wider bg-[#f5821f] text-white px-4 py-1 rounded-full hover:bg-[#e0711a] transition-colors"
            >
              Anuncie
            </Link>
          </div>
        </div>
        <div className="h-0.5 bg-[#f5821f]" />
      </nav>

      {/* ── Menu mobile ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          <MobileLink href="/sp/sumare" onClick={() => setMobileOpen(false)}>Sumaré</MobileLink>

          <div className="pt-1 pb-1">
            <p className="text-gray-400 text-xs uppercase font-bold px-2 pb-1">Região</p>
            {REGIAO.map((item) => (
              <MobileLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)} sub>
                {item.name}
              </MobileLink>
            ))}
          </div>

          <MobileLink href="/brasil" onClick={() => setMobileOpen(false)}>Brasil</MobileLink>

          <div className="pt-1 pb-1">
            <p className="text-gray-400 text-xs uppercase font-bold px-2 pb-1">Temas</p>
            <div className="grid grid-cols-2">
              {TEMAS.map((item) => (
                <MobileLink key={item.href} href={item.href} onClick={() => setMobileOpen(false)} sub>
                  {item.name}
                </MobileLink>
              ))}
            </div>
          </div>

          <MobileLink href="/colunistas" onClick={() => setMobileOpen(false)}>Colunistas</MobileLink>
          <MobileLink href="/edicao-impressa" onClick={() => setMobileOpen(false)}>Ed. Impressa</MobileLink>
          <MobileLink href="/anuncie" onClick={() => setMobileOpen(false)}>Anuncie</MobileLink>
          <MobileLink href="/busca" onClick={() => setMobileOpen(false)}>Buscar</MobileLink>
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
      className={`block px-2 py-2 rounded hover:bg-gray-50 hover:text-[#f5821f] transition-colors font-semibold text-[#1a1a1a] ${
        sub ? 'text-sm pl-4 text-gray-600' : 'text-sm uppercase tracking-wide'
      }`}
    >
      {children}
    </Link>
  )
}
