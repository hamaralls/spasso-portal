'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { WeeklyEdition } from '@/types'

interface Props {
  initial?: WeeklyEdition | null
}

function nextFriday(): string {
  const d = new Date()
  const day = d.getDay() // 0=dom, 5=sex
  const diff = (5 - day + 7) % 7 || 7 // dias até a próxima sexta
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

async function extractPdfCover(file: File): Promise<Blob | null> {
  try {
    // Importação dinâmica para não incluir no bundle server
    const pdfjsLib = await import('pdfjs-dist')
    // pdfjs v5: usar worker bundled — cdnjs não tem a versão exata
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise

    return new Promise<Blob | null>(resolve =>
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
    )
  } catch {
    return null
  }
}

async function uploadFile(file: File | Blob, name: string): Promise<string | null> {
  try {
    const fd = new FormData()
    fd.append('file', file instanceof File ? file : new File([file], name, { type: 'image/jpeg' }))
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const json = await res.json()
    return json.url ?? null
  } catch {
    return null
  }
}

export default function EditionForm({ initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const [num, setNum]         = useState(initial?.edition_number?.toString() ?? '')
  const [date, setDate]       = useState(initial?.published_date ?? nextFriday())
  const [title, setTitle]     = useState(initial?.title ?? '')
  const [desc, setDesc]       = useState(initial?.description ?? '')
  const [pdfUrl, setPdfUrl]   = useState(initial?.pdf_url ?? '')
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? '')
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState('')
  const [error, setError]       = useState('')

  const pdfRef  = useRef<HTMLInputElement>(null)
  const imgRef  = useRef<HTMLInputElement>(null)

  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return

    setLoading(true)
    setError('')

    // 1. Upload PDF
    setStep('Enviando PDF…')
    const url = await uploadFile(file, file.name)
    if (!url) { setError('Falha ao enviar PDF'); setLoading(false); return }
    setPdfUrl(url)

    // 2. Extrai capa via PDF.js
    setStep('Extraindo capa…')
    const coverBlob = await extractPdfCover(file)
    if (coverBlob) {
      setStep('Enviando capa…')
      const coverName = `capa-${date || nextFriday()}.jpg`
      const cUrl = await uploadFile(coverBlob, coverName)
      if (cUrl) setCoverUrl(cUrl)
    }

    setStep('')
    setLoading(false)
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStep('Enviando capa…')
    const url = await uploadFile(file, file.name)
    if (url) setCoverUrl(url)
    else setError('Falha ao enviar capa')
    setStep('')
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pdfUrl) { setError('Envie o PDF primeiro'); return }
    if (!date)   { setError('Data obrigatória'); return }

    setLoading(true)
    setError('')

    const payload = {
      edition_number: num ? Number(num) : null,
      published_date: date,
      title: title || `Edição${num ? ` ${num}` : ''} — ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      pdf_url: pdfUrl,
      cover_url: coverUrl || null,
      description: desc || null,
    }

    const url    = isEdit ? `/api/edicoes/${initial!.id}` : '/api/edicoes'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Erro ao salvar')
      return
    }

    router.push('/admin/edicoes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          PDF da edição <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => !loading && pdfRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            pdfUrl ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-[#f5821f] bg-gray-50'
          }`}
        >
          {loading && step ? (
            <p className="text-sm text-gray-500">{step}</p>
          ) : pdfUrl ? (
            <div>
              <p className="text-green-600 font-semibold text-sm">✓ PDF enviado</p>
              <p className="text-xs text-gray-400 mt-1 truncate max-w-xs mx-auto">{pdfUrl.split('/').pop()}</p>
              <button type="button" onClick={(ev) => { ev.stopPropagation(); setPdfUrl(''); setCoverUrl('') }}
                className="mt-2 text-xs text-red-500 hover:underline">Remover</button>
            </div>
          ) : (
            <div>
              <p className="text-2xl mb-1">📄</p>
              <p className="text-sm font-medium text-gray-600">Clique para selecionar o PDF</p>
              <p className="text-xs text-gray-400 mt-1">A capa será extraída automaticamente</p>
            </div>
          )}
        </div>
        <input ref={pdfRef} type="file" accept="application/pdf" className="hidden"
          onChange={handlePdfChange} />
      </div>

      {/* Capa preview + troca manual */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Capa <span className="text-gray-400 font-normal">(auto-extraída do PDF)</span>
        </label>
        <div className="flex items-start gap-4">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Capa" className="w-24 rounded shadow object-cover" />
          ) : (
            <div className="w-24 h-32 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs text-center">
              Sem capa
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => imgRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:border-[#f5821f] transition-colors">
              {coverUrl ? 'Trocar capa' : 'Enviar capa manualmente'}
            </button>
            {coverUrl && (
              <button type="button" onClick={() => setCoverUrl('')}
                className="text-xs text-red-500 hover:underline text-left">Remover capa</button>
            )}
          </div>
        </div>
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={handleCoverChange} />
      </div>

      {/* Número e data */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Número da edição</label>
          <input type="number" value={num} onChange={e => setNum(e.target.value)}
            placeholder="ex: 123"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/40" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Data de publicação <span className="text-red-500">*</span>
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/40" />
        </div>
      </div>

      {/* Título personalizado */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Título <span className="text-gray-400 font-normal">(opcional — gerado automaticamente)</span>
        </label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Edição 123 — Eleições 2026"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/40" />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Destaques da edição</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
          placeholder="Assuntos principais desta edição…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/40 resize-none" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !pdfUrl}
          className="px-6 py-2 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#e0711a] transition-colors disabled:opacity-50"
        >
          {loading ? step || 'Salvando…' : isEdit ? 'Salvar alterações' : 'Publicar edição'}
        </button>
        <a href="/admin/edicoes" className="text-sm text-gray-500 hover:text-gray-700">Cancelar</a>
      </div>
    </form>
  )
}
