import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade do Spasso Cidades em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade/' },
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-8">Atualizada em abril de 2026</p>

      <div className="prose-spasso space-y-6">
        <p>
          A sua privacidade é importante para nós. Esta política descreve como o <strong>Spasso Cidades</strong>{' '}
          coleta, usa, protege e compartilha as informações pessoais dos nossos leitores, em conformidade
          com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Coleta de informações</h2>
        <p>
          Coletamos informações pessoais como nome e e-mail quando você se inscreve em nossa newsletter.
          Utilizamos o <strong>Google Analytics 4</strong> para análise de audiência — os dados são
          agregados e anonimizados. Cookies e tecnologias de rastreamento podem ser usados para entender
          como você utiliza o portal.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Uso das informações</h2>
        <p>As informações coletadas são usadas para:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Enviar nossa newsletter (somente com seu consentimento)</li>
          <li>Melhorar nossos serviços e personalizar a experiência</li>
          <li>Entender o comportamento de uso do portal</li>
          <li>Cumprir obrigações legais</li>
        </ul>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do portal e cookies analíticos (Google
          Analytics 4). Você pode desativar cookies através das configurações do seu navegador, mas
          isso pode afetar a funcionalidade do site. No futuro, implementaremos um banner de
          consentimento de cookies conforme exigido pela LGPD.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Proteção de dados</h2>
        <p>
          Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações
          contra acesso não autorizado, alteração, divulgação ou destruição. Apenas colaboradores
          autorizados têm acesso a dados pessoais.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Compartilhamento de informações</h2>
        <p>
          Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros sem o seu
          consentimento, exceto para parceiros que nos auxiliam na operação do portal e que se
          comprometem a manter a confidencialidade dos dados.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Seus direitos (LGPD)</h2>
        <p>Você tem direito a:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados incompletos ou incorretos</li>
          <li>Solicitar a exclusão dos seus dados</li>
          <li>Revogar consentimento a qualquer momento</li>
          <li>Portabilidade dos dados</li>
        </ul>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Alterações nesta política</h2>
        <p>
          Reservamo-nos o direito de atualizar esta política periodicamente. Alterações significativas
          serão comunicadas no portal. Recomendamos revisitar esta página regularmente.
        </p>

        <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-3">Contato</h2>
        <p>
          Dúvidas sobre privacidade ou para exercer seus direitos:{' '}
          <a href="mailto:privacidade@jornalspassocidades.com.br" className="text-[#dd8500] hover:underline">
            privacidade@jornalspassocidades.com.br
          </a>
        </p>
      </div>
    </div>
  )
}
