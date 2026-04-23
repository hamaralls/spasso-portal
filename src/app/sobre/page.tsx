import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Sobre o Spasso Cidades',
  description: 'Conheça o Spasso Cidades — o diário digital de Sumaré e região. Jornalismo regional independente desde 2024.',
  alternates: { canonical: '/sobre' },
}

export default function SobrePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Sobre o Spasso Cidades</h1>
      <p className="text-[#f5821f] font-semibold mb-8">O diário digital de Sumaré e região</p>

      <div className="prose-spasso space-y-6">
        <p>
          O <strong>Spasso Cidades</strong> é um veículo de comunicação dedicado a trazer as notícias
          mais relevantes e de interesse para a comunidade de Sumaré e da Região Metropolitana de
          Campinas. Nascemos como jornal impresso — com tiragem semanal de 5 mil exemplares e
          distribuição gratuita — e evoluímos para o digital sem abrir mão do compromisso com o
          jornalismo local.
        </p>

        <p>
          Além do jornal impresso, estamos presentes nas redes sociais e neste portal online,
          ampliando nosso alcance e conectando cada vez mais a comunidade.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Nossa missão</h2>
        <p>
          Informar e conectar a comunidade de Sumaré e região, proporcionando conteúdo de qualidade
          que aborda desde os desafios locais até as conquistas que merecem ser celebradas. Com
          jornalistas comprometidos e responsabilidade social, buscamos sempre o melhor para nossos
          leitores.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">O que cobrimos</h2>
        <ul className="list-disc list-inside space-y-1 text-[#1a1a1a]">
          <li>Política e gestão municipal</li>
          <li>Saúde e bem-estar</li>
          <li>Educação e cultura</li>
          <li>Economia e empregos</li>
          <li>Esporte e eventos</li>
          <li>Segurança pública</li>
          <li>Notícias da RMC e do Brasil</li>
        </ul>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Equipe</h2>
        <div className="bg-[#f5f5f5] rounded-lg p-4 space-y-2">
          <p><strong>Fundadora e Diretora Executiva:</strong> Elaine Amaral</p>
          <p><strong>Razão Social:</strong> Elaine Cristina Batista do Amaral ME</p>
          <p><strong>E-mail:</strong>{' '}
            <a href="mailto:contato@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline">
              contato@jornalspassocidades.com.br
            </a>
          </p>
        </div>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Fale com a redação</h2>
        <p>
          Sugestões de pauta, press releases e informações:{' '}
          <a href="mailto:redacao@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline">
            redacao@jornalspassocidades.com.br
          </a>
        </p>
        <p>
          Para anúncios e publicidade:{' '}
          <a href="/anuncie" className="text-[#f5821f] hover:underline">
            acesse nossa página Anuncie
          </a>
          {' '}ou envie para{' '}
          <a href="mailto:comercial@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline">
            comercial@jornalspassocidades.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
