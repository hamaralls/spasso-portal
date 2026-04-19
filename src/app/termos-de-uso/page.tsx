import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso do portal Spasso Cidades.',
  alternates: { canonical: '/termos-de-uso/' },
}

export default function TermosPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-8">Atualizado em abril de 2026</p>

      <div className="prose-spasso space-y-6">
        <p>
          Bem-vindo ao <strong>Spasso Cidades</strong>. Ao acessar e utilizar nosso portal, você
          concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Leia com
          atenção antes de navegar.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Uso do site</h2>
        <p>
          O conteúdo do portal é fornecido para informação geral e uso pessoal. Está sujeito a
          alterações sem aviso prévio. O acesso ao portal é gratuito e não requer cadastro para
          leitura de notícias.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Propriedade intelectual</h2>
        <p>
          Todo o conteúdo publicado no Spasso Cidades — textos, fotografias, vídeos, logotipos e
          identidade visual — é de propriedade do Spasso Cidades ou de seus respectivos autores e
          está protegido pela legislação brasileira de direitos autorais (Lei nº 9.610/1998).
        </p>
        <p>
          É vedada a reprodução total ou parcial do conteúdo sem autorização prévia por escrito.
          A citação de trechos com indicação da fonte é permitida para fins jornalísticos e
          educacionais.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Conteúdo de terceiros</h2>
        <p>
          Parte do conteúdo publicado é proveniente de assessorias de comunicação, prefeituras e
          colaboradores. Nesses casos, o material é identificado com badge de origem visível.
          O Spasso Cidades não se responsabiliza pelo conteúdo de terceiros identificados como tal.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Limitações de responsabilidade</h2>
        <p>
          Não garantimos que o portal estará livre de erros ou que o acesso será ininterrupto.
          O Spasso Cidades não se responsabiliza por eventuais danos resultantes do uso ou da
          impossibilidade de uso do portal.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Links externos</h2>
        <p>
          O portal pode conter links para sites de terceiros, fornecidos por conveniência. Esses
          links não significam endosso do conteúdo externo. O Spasso Cidades não tem
          responsabilidade pelo conteúdo dos sites vinculados.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Alterações nos termos</h2>
        <p>
          Podemos revisar estes termos a qualquer momento. As alterações entram em vigor na data
          de publicação nesta página. O uso continuado do portal após as alterações implica
          aceitação dos novos termos.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Contato</h2>
        <p>
          Dúvidas sobre estes termos:{' '}
          <a href="mailto:contato@jornalspassocidades.com.br" className="text-[#dd8500] hover:underline">
            contato@jornalspassocidades.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
