import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-6">Política de Privacidade</h1>
      <div className="prose-spasso">
        <p>O Spasso Cidades respeita a privacidade dos seus leitores.</p>
        <h2>Dados coletados</h2>
        <p>
          Utilizamos o Google Analytics 4 para análise de audiência. Os dados coletados são anônimos
          e seguem as diretrizes da LGPD (Lei Geral de Proteção de Dados).
        </p>
        <h2>Cookies</h2>
        <p>
          O portal pode utilizar cookies de análise de audiência (Google Analytics).
          Ao continuar navegando, você concorda com o uso desses cookies.
        </p>
        <h2>Contato</h2>
        <p>
          Dúvidas sobre privacidade: <a href="mailto:privacidade@jornalspassocidades.com.br">privacidade@jornalspassocidades.com.br</a>
        </p>
      </div>
    </div>
  )
}
