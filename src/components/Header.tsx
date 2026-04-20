'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Search, ChevronDown } from 'lucide-react'

// Cidades com foco editorial — links diretos no nav desktop
const CIDADES_NAV = [
  { name: 'Sumaré',      href: '/sp/sumare' },
  { name: 'Hortolândia', href: '/sp/hortolandia' },
  { name: 'Nova Odessa', href: '/sp/nova-odessa' },
  { name: 'Campinas',    href: '/sp/campinas' },
  { name: 'Paulínia',    href: '/sp/paulinia' },
  { name: 'Monte Mor',   href: '/sp/monte-mor' },
]

// Dropdown RMC — todas as cidades da região
const RMC_ITEMS = [
  { name: 'Hortolândia',          href: '/sp/hortolandia' },
  { name: 'Nova Odessa',          href: '/sp/nova-odessa' },
  { name: 'Campinas',             href: '/sp/campinas' },
  { name: 'Paulínia',             href: '/sp/paulinia' },
  { name: 'Monte Mor',            href: '/sp/monte-mor' },
  { name: "Sta. Bárbara d'Oeste", href: '/sp/santa-barbara-doeste' },
  { name: 'Interior SP',          href: '/rmc' },
]

// Dropdown Categorias — 2 colunas (col1: maior volume; col2: menor volume)
const CATEGORIAS_COL1 = [
  { name: 'Saúde',         href: '/saude' },
  { name: 'Política',      href: '/politica' },
  { name: 'Economia',      href: '/economia' },
  { name: 'Educação',      href: '/educacao' },
  { name: 'Cultura e Lazer', href: '/cultura-e-lazer' },
]
const CATEGORIAS_COL2 = [
  { name: 'Esporte',       href: '/esporte' },
  { name: 'Tecnologia',    href: '/tecnologia' },
  { name: 'Meio Ambiente', href: '/meio-ambiente' },
  { name: 'Empregos',      href: '/empregos' },
  { name: 'Estilo de Vida', href: '/estilo-de-vida' },
]

// Menu mobile completo
const MOBILE_ITEMS = [
  { name: 'Últimas Notícias',      href: '/' },
  { name: 'Sumaré',                href: '/sp/sumare' },
  { name: 'Hortolândia',           href: '/sp/hortolandia' },
  { name: 'Nova Odessa',           href: '/sp/nova-odessa' },
  { name: 'Campinas',              href: '/sp/campinas' },
  { name: 'Paulínia',              href: '/sp/paulinia' },
  { name: 'Monte Mor',             href: '/sp/monte-mor' },
  { name: "Sta. Bárbara d'Oeste",  href: '/sp/santa-barbara-doeste' },
  { name: 'RMC',                   href: '/rmc' },
  { name: 'Brasil',                href: '/brasil' },
  { name: 'Entretenimento',        href: '/eventos' },
  { name: 'Política',              href: '/politica' },
  { name: 'Saúde',                 href: '/saude' },
  { name: 'Economia',              href: '/economia' },
  { name: 'Educação',              href: '/educacao' },
  { name: 'Esporte',               href: '/esporte' },
  { name: 'Cultura e Lazer',       href: '/cultura-e-lazer' },
  { name: 'Tecnologia',            href: '/tecnologia' },
  { name: 'Meio Ambiente',         href: '/meio-ambiente' },
  { name: 'Empregos',              href: '/empregos' },
  { name: 'Estilo de Vida',        href: '/estilo-de-vida' },
  { name: 'Colunistas',            href: '/colunistas' },
  { name: 'Ed. Impressa',          href: '/edicao-impressa' },
  { name: 'Anuncie',               href: '/anuncie' },
  { name: 'Buscar',                href: '/busca' },
]

const NAV_LINK = 'whitespace-nowrap text-[#333] text-[13px] font-medium hover:text-[#f5821f] transition-colors'

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

          {/* Direita: busca com texto */}
          <div className="w-28 lg:w-44 shrink-0 flex justify-end">
            <Link href="/busca" aria-label="Buscar"
              className="flex items-center gap-1 text-gray-400 hover:text-[#f5821f] transition-colors p-1">
              <Search size={18} />
              <span className="hidden lg:inline text-[12px] font-medium">Busca</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── NavBar flat + dropdowns (desktop) ── */}
      <nav className="hidden lg:block border-t border-gray-100">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex items-center justify-center gap-5 h-11 min-w-max px-4 mx-auto max-w-7xl">

            {/* Últimas Notícias */}
            <Link href="/" className={NAV_LINK}>Últimas Notícias</Link>

            {/* Cidades editoriais */}
            {CIDADES_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={NAV_LINK}>
                {item.name}
              </Link>
            ))}

            {/* RMC dropdown */}
            <div className="relative group h-full flex items-center">
              <Link href="/rmc"
                className={`${NAV_LINK} flex items-center gap-0.5`}>
                RMC
                <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-lg rounded-lg border border-gray-100 py-2 min-w-[200px] z-50">
                {RMC_ITEMS.map(item => (
                  <Link key={item.href} href={item.href}
                    className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Brasil + Entretenimento + Colunistas */}
            <Link href="/brasil" className={NAV_LINK}>Brasil</Link>
            <Link href="/eventos" className={NAV_LINK}>Entretenimento</Link>
            <Link href="/colunistas" className={NAV_LINK}>Colunistas</Link>

            {/* Categorias dropdown — 2 colunas */}
            <div className="relative group h-full flex items-center">
              <button className={`${NAV_LINK} flex items-center gap-0.5 bg-transparent border-none cursor-pointer`}>
                Categorias
                <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="absolute top-full right-0 hidden group-hover:block bg-white shadow-lg rounded-lg border border-gray-100 py-2 min-w-[300px] z-50">
                <div className="grid grid-cols-2">
                  <div>
                    {CATEGORIAS_COL1.map(item => (
                      <Link key={item.href} href={item.href}
                        className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  <div>
                    {CATEGORIAS_COL2.map(item => (
                      <Link key={item.href} href={item.href}
                        className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        {/* Linha gradiente laranja → verde limão */}
        <div className="h-0.5 bg-gradient-to-r from-[#f5821f] to-[#8dc63f]" />
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
