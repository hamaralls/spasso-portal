'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Search, ChevronDown } from 'lucide-react'

// Cidades foco editorial — flat no desktop
const CIDADES_NAV = [
  { name: 'Sumaré',      href: '/sp/sumare' },
  { name: 'Hortolândia', href: '/sp/hortolandia' },
  { name: 'Nova Odessa', href: '/sp/nova-odessa' },
  { name: 'Paulínia',    href: '/sp/paulinia' },
  { name: 'Monte Mor',   href: '/sp/monte-mor' },
]

// Dropdown RMC ▾ — cidades secundárias + portal regional
const RMC_ITEMS = [
  { name: 'Campinas',              href: '/sp/campinas' },
  { name: "Sta. Bárbara d'Oeste",  href: '/sp/santa-barbara-doeste' },
  { name: 'Outras cidades',        href: '/sp/outras-cidades' },
  { name: 'Toda a RMC',            href: '/rmc' },
]

// Dropdown Temas ▾ — 2 colunas, todos os temas
const TEMAS_COL1 = [
  { name: 'Política',        href: '/politica' },
  { name: 'Saúde',           href: '/saude' },
  { name: 'Educação',        href: '/educacao' },
  { name: 'Economia',        href: '/economia' },
  { name: 'Cultura e Lazer', href: '/cultura-e-lazer' },
  { name: 'Esporte',         href: '/esporte' },
]
const TEMAS_COL2 = [
  { name: 'Tecnologia',     href: '/tecnologia' },
  { name: 'Meio Ambiente',  href: '/meio-ambiente' },
  { name: 'Empregos',       href: '/empregos' },
  { name: 'Estilo de Vida', href: '/estilo-de-vida' },
  { name: 'Entretenimento', href: '/eventos' },
  { name: 'Segurança',      href: '/seguranca' },
]

// Menu mobile completo
const MOBILE_ITEMS = [
  { name: 'Últimas Notícias',      href: '/ultimas-noticias' },
  { name: 'Sumaré',                href: '/sp/sumare' },
  { name: 'Hortolândia',           href: '/sp/hortolandia' },
  { name: 'Nova Odessa',           href: '/sp/nova-odessa' },
  { name: 'Paulínia',              href: '/sp/paulinia' },
  { name: 'Monte Mor',             href: '/sp/monte-mor' },
  { name: 'Campinas',              href: '/sp/campinas' },
  { name: "Sta. Bárbara d'Oeste",  href: '/sp/santa-barbara-doeste' },
  { name: 'RMC',                   href: '/rmc' },
  { name: 'Brasil',                href: '/brasil' },
  { name: 'Política',              href: '/politica' },
  { name: 'Saúde',                 href: '/saude' },
  { name: 'Educação',              href: '/educacao' },
  { name: 'Economia',              href: '/economia' },
  { name: 'Cultura e Lazer',       href: '/cultura-e-lazer' },
  { name: 'Esporte',               href: '/esporte' },
  { name: 'Tecnologia',            href: '/tecnologia' },
  { name: 'Meio Ambiente',         href: '/meio-ambiente' },
  { name: 'Empregos',              href: '/empregos' },
  { name: 'Estilo de Vida',        href: '/estilo-de-vida' },
  { name: 'Entretenimento',        href: '/eventos' },
  { name: 'Colunistas',            href: '/colunistas' },
  { name: 'Edição de Sexta',       href: '/edicao-de-sexta' },
  { name: 'Anuncie',               href: '/anuncie' },
  { name: 'Buscar',                href: '/busca' },
]

const NAV_LINK = 'whitespace-nowrap text-[#333] text-[13px] font-medium hover:text-[#f5821f] transition-colors'

function formatDate() {
  const raw = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const sem_feira = raw.replace('-feira', '')
  return sem_feira.charAt(0).toUpperCase() + sem_feira.slice(1)
}

// Dropdown posicionado com position:fixed para não ser clipado pelo overflow-x-auto do nav
function NavDropdown({
  label,
  href,
  items,
  cols = 1,
}: {
  label: string
  href?: string
  items: { name: string; href: string }[] | { col1: { name: string; href: string }[]; col2: { name: string; href: string }[] }
  cols?: 1 | 2
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.bottom, left: rect.left })
    }
    setOpen(true)
  }

  const itemList = Array.isArray(items) ? items : null
  const col1 = !Array.isArray(items) ? items.col1 : null
  const col2 = !Array.isArray(items) ? items.col2 : null

  return (
    <div
      ref={ref}
      className="relative h-full flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      {href ? (
        <Link href={href} className={`${NAV_LINK} flex items-center gap-0.5`}>
          {label}
          <ChevronDown size={11} className={`opacity-50 transition-opacity ${open ? 'opacity-100' : ''}`} />
        </Link>
      ) : (
        <button className={`${NAV_LINK} flex items-center gap-0.5 bg-transparent border-none cursor-pointer`}>
          {label}
          <ChevronDown size={11} className={`opacity-50 transition-opacity ${open ? 'opacity-100' : ''}`} />
        </button>
      )}

      {open && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className={`bg-white shadow-lg rounded-lg border border-gray-100 py-2 ${cols === 2 ? 'min-w-[300px]' : 'min-w-[200px]'}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {cols === 1 && itemList && itemList.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
              {item.name}
            </Link>
          ))}
          {cols === 2 && col1 && col2 && (
            <div className="grid grid-cols-2">
              <div>
                {col1.map(item => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div>
                {col2.map(item => (
                  <Link key={item.href} href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-[13px] text-[#333] hover:text-[#f5821f] hover:bg-gray-50 transition-colors whitespace-nowrap">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">

      {/* ── Masthead: data + logo centralizado + busca ── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className={`relative flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-2 lg:py-3' : 'py-5 lg:py-8'}`}>

          {/* Esquerda: hamburguer (mobile) / data (desktop) */}
          <div className="w-20 lg:w-44 shrink-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-[#f5821f] transition-colors p-1"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              <span className="text-[11px] font-medium">{mobileOpen ? 'Fechar' : 'Menu'}</span>
            </button>
            <span className={`hidden lg:block text-gray-500 leading-tight whitespace-nowrap transition-all duration-300 ${scrolled ? 'text-[11px]' : 'text-[13px]'}`}>
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
              className={`h-auto transition-all duration-300 ${scrolled ? 'w-[200px] lg:w-[280px]' : 'w-[320px] lg:w-[480px]'}`}
            />
          </Link>

          {/* Direita: busca */}
          <div className="w-20 lg:w-44 shrink-0 flex justify-end">
            <Link href="/busca" aria-label="Buscar"
              className="flex items-center gap-1 text-gray-500 hover:text-[#f5821f] transition-colors p-1">
              <Search size={18} />
              <span className="text-[11px] font-medium lg:text-[12px]">Busca</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Linha gradiente mobile — sempre visível */}
      <div className="lg:hidden h-0.5 bg-gradient-to-r from-[#f5821f] to-[#8dc63f]" />

      {/* ── NavBar (desktop) — overflow-x-auto APENAS para scroll; dropdowns usam position:fixed ── */}
      <nav className="hidden lg:block border-t border-gray-100">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <div className="flex items-center justify-center gap-5 h-11 min-w-max px-4 mx-auto max-w-7xl">

            <Link href="/ultimas-noticias" className={NAV_LINK}>Últimas Notícias</Link>

            {CIDADES_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={NAV_LINK}>
                {item.name}
              </Link>
            ))}

            <NavDropdown label="RMC" href="/rmc" items={RMC_ITEMS} cols={1} />

            <Link href="/brasil" className={NAV_LINK}>Brasil</Link>

            <NavDropdown
              label="Temas"
              items={{ col1: TEMAS_COL1, col2: TEMAS_COL2 }}
              cols={2}
            />

            <Link href="/colunistas" className={NAV_LINK}>Colunistas</Link>

            <Link href="/edicao-de-sexta" className={NAV_LINK}>Ed. de Sexta</Link>

          </div>
        </div>
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
