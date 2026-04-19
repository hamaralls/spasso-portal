'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'

// Nav flat — estilo Metrópoles
const NAV_ITEMS = [
  { name: 'Últimas',       href: '/' },
  { name: 'Sumaré',        href: '/sp/sumare' },
  { name: 'Hortolândia',   href: '/sp/hortolandia' },
  { name: 'Nova Odessa',   href: '/sp/nova-odessa' },
  { name: 'Campinas',      href: '/sp/campinas' },
  { name: 'Paulínia',      href: '/sp/paulinia' },
  { name: 'Monte Mor',     href: '/sp/monte-mor' },
  { name: 'RMC',           href: '/rmc' },
  { name: 'Brasil',        href: '/brasil' },
  { name: 'Política',      href: '/politica' },
  { name: 'Saúde',         href: '/saude' },
  { name: 'Economia',      href: '/economia' },
  { name: 'Educação',      href: '/educacao' },
  { name: 'Esportes',      href: '/esporte' },
  { name: 'Cultura',       href: '/cultura-e-lazer' },
  { name: 'Vida & Estilo', href: '/estilo-de-vida' },
  { name: 'Colunistas',    href: '/colunistas' },
]

// Menu mobile completo (inclui itens extras não na nav desktop)
const MOBILE_ITEMS = [
  { name: 'Últimas Notícias',  href: '/' },
  { name: 'Sumaré',            href: '/sp/sumare' },
  { name: 'Hortolândia',       href: '/sp/hortolandia' },
  { name: 'Nova Odessa',       href: '/sp/nova-odessa' },
  { name: 'Campinas',          href: '/sp/campinas' },
  { name: 'Paulínia',          href: '/sp/paulinia' },
  { name: 'Monte Mor',         href: '/sp/monte-mor' },
  { name: "Sta. Bárbara",      href: '/sp/santa-barbara-doeste' },
  { name: 'RMC',               href: '/rmc' },
  { name: 'Brasil',            href: '/brasil' },
  { name: 'Política',          href: '/politica' },
  { name: 'Saúde',             href: '/saude' },
  { name: 'Economia',          href: '/economia' },
  { name: 'Educação',          href: '/educacao' },
  { name: 'Esportes',          href: '/esporte' },
  { name: 'Cultura e Lazer',   href: '/cultura-e-lazer' },
  { name: 'Vida & Estilo',     href: '/estilo-de-vida' },
  { name: 'Meio Ambiente',     href: '/meio-ambiente' },
  { name: 'Tecnologia',        href: '/tecnologia' },
  { name: 'Eventos',           href: '/eventos' },
  { name: 'Empregos',          href: '/empregos' },
  { name: 'Colunistas',        href: '/colunistas' },
  { name: 'Ed. Impressa',      href: '/edicao-impressa' },
  { name: 'Anuncie',           href: '/anuncie' },
  { name: 'Buscar',            href: '/busca' },
]

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">

      {/* ── Masthead: data + logo centralizado + busca ── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative flex items-center justify-between py-5 lg:py-8">

          {/* Esquerda: hamburguer (mobile) / data (desktop) */}
          <div className="w-28 lg:w-44 shrink-0">
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

          {/* Centro: logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png"
              alt="Spasso Cidades"
              width={520}
              height={104}
              priority
              className="w-[210px] lg:w-[460px] h-auto"
            />
          </Link>

          {/* Direita: busca */}
          <div className="w-28 lg:w-44 shrink-0 flex justify-end">
            <Link href="/busca" aria-label="Buscar"
              className="text-gray-400 hover:text-[#f5821f] transition-colors p-1">
              <Search size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── NavBar flat (desktop) ── */}
      <nav className="hidden lg:block border-t border-gray-100">
        {/* scroll horizontal suave quando itens ultrapassam container */}
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex items-center justify-center gap-5 h-11 min-w-max px-4 mx-auto max-w-7xl">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-[#1a1a1a] text-[11px] font-semibold uppercase tracking-wide hover:text-[#f5821f] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="h-0.5 bg-[#f5821f]" />
      </nav>

      {/* ── Menu mobile ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
          <div className="grid grid-cols-2 gap-x-2">
            {MOBILE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2.5 text-sm font-medium text-[#1a1a1a] hover:text-[#f5821f] transition-colors border-b border-gray-50"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
