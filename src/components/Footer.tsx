import Link from 'next/link'
import Image from 'next/image'
import NewsletterSignup from '@/components/NewsletterSignup'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1a1a1a] text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/lgotipo SPASSO branco.png"
                alt="Spasso Cidades"
                width={180}
                height={36}
                className="object-contain"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              O diário digital de Sumaré e região. Cobertura da Região Metropolitana de Campinas.
            </p>
            <div className="mt-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">
                Newsletter
              </p>
              <NewsletterSignup />
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="font-bold uppercase text-xs tracking-widest mb-3 text-white/50">Portal</p>
            <ul className="space-y-2">
              {[
                { name: 'Últimas Notícias', href: '/ultimas-noticias' },
                { name: 'Sumaré', href: '/sp/sumare' },
                { name: 'Brasil', href: '/brasil' },
                { name: 'Colunistas', href: '/colunistas' },
                { name: 'Edição Impressa', href: '/edicao-impressa' },
                { name: 'Anuncie', href: '/anuncie' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <p className="font-bold uppercase text-xs tracking-widest mb-3 text-white/50">Institucional</p>
            <ul className="space-y-2">
              {[
                { name: 'Sobre', href: '/sobre' },
                { name: 'Contato', href: '/contato' },
                { name: 'Política de Privacidade', href: '/privacidade' },
                { name: 'Termos de Uso', href: '/termos-de-uso' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-white/50 text-xs">
            © {year} Spasso Cidades. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/jornalspassocidades"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/spassocidades"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
