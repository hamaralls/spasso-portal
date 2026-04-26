'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ColumnistFormValues {
  id?: string
  name: string
  slug: string
  subtitle: string
  bio: string
  type: 'editorial' | 'person'
  avatar_url: string
  active: boolean
}

interface Props {
  initial?: ColumnistFormValues
}

export default function ColumnistForm({ initial }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const isNew = !initial?.id

  const [form, setForm] = useState<ColumnistFormValues>(initial ?? {
    name: '',
    slug: '',
    subtitle: '',
    bio: '',
    type: 'person',
    avatar_url: '',
    active: true,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof ColumnistFormValues, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function uploadAvatar(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload falhou')
      const { url } = await res.json()
      set('avatar_url', url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = isNew ? '/api/admin/colunistas' : `/api/admin/colunistas/${initial!.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          subtitle: form.subtitle || undefined,
          bio: form.bio || undefined,
          avatar_url: form.avatar_url || undefined,
          type: form.type,
          active: form.active,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Erro ao salvar')
      }
      router.push('/admin/colunistas')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!confirm('Excluir este colunista? Os artigos vinculados perderão o vínculo.')) return
    setSaving(true)
    try {
      await fetch(`/api/admin/colunistas/${initial.id}`, { method: 'DELETE' })
      router.push('/admin/colunistas')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Tipo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
        <div className="flex gap-3">
          {(['person', 'editorial'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                form.type === t
                  ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#7c3aed]'
              }`}
            >
              {t === 'person' ? 'Pessoa (colunista real)' : 'Editorial (voz institucional)'}
            </button>
          ))}
        </div>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
        <input
          required
          value={form.name}
          onChange={e => {
            set('name', e.target.value)
            if (isNew) set('slug', autoSlug(e.target.value))
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/50"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Subtítulo <span className="font-normal text-gray-400">(ex: por Elaine Amaral)</span>
        </label>
        <input
          value={form.subtitle}
          onChange={e => set('subtitle', e.target.value)}
          placeholder="por Nome da Autora"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/50"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
        <input
          required
          value={form.slug}
          onChange={e => set('slug', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#f5821f]/50"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => set('bio', e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/50 resize-none"
        />
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Foto / Avatar</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 flex items-center justify-center overflow-hidden shrink-0">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#7c3aed]">
                {form.name ? form.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) uploadAvatar(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm text-[#f5821f] hover:underline disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Enviar foto'}
            </button>
            {form.avatar_url && (
              <button
                type="button"
                onClick={() => set('avatar_url', '')}
                className="block text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ativo */}
      <div className="flex items-center gap-3">
        <input
          id="active"
          type="checkbox"
          checked={form.active}
          onChange={e => set('active', e.target.checked)}
          className="w-4 h-4 rounded accent-[#f5821f]"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">Ativo</label>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#f5821f] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#e0711a] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando...' : isNew ? 'Criar colunista' : 'Salvar alterações'}
        </button>
        <a href="/admin/colunistas" className="text-sm text-gray-500 hover:text-gray-700">Cancelar</a>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto text-sm text-red-500 hover:underline disabled:opacity-50"
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  )
}
