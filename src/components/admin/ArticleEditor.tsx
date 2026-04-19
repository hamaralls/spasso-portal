'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import type { Category, Columnist } from '@/types'

interface ArticleData {
  id?: string
  title: string
  slug: string
  excerpt: string
  category_slug: string
  content_type: string
  source_type: string
  origin_badge: string
  featured_image_url: string
  seo_title: string
  seo_description: string
  status: 'draft' | 'published' | 'archived'
  content: { rendered: string }
  columnist_id?: string
}

interface Props {
  categories: Category[]
  columnists?: Columnist[]
  initial?: Partial<ArticleData>
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default function ArticleEditor({ categories, columnists = [], initial }: Props) {
  const router = useRouter()
  const isEditing = !!initial?.id

  const [title, setTitle]           = useState(initial?.title ?? '')
  const [slug, setSlug]             = useState(initial?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [excerpt, setExcerpt]       = useState(initial?.excerpt ?? '')
  const [category, setCategory]     = useState(initial?.category_slug ?? '')
  const [contentType, setContentType] = useState(initial?.content_type ?? 'news')
  const [sourceType, setSourceType]   = useState(initial?.source_type ?? 'original')
  const [originBadge, setOriginBadge] = useState(initial?.origin_badge ?? '')
  const [columnistId, setColumnistId] = useState(initial?.columnist_id ?? '')
  const [coverUrl, setCoverUrl]     = useState(initial?.featured_image_url ?? '')
  const [seoTitle, setSeoTitle]     = useState(initial?.seo_title ?? '')
  const [seoDesc, setSeoDesc]       = useState(initial?.seo_description ?? '')
  const [saving, setSaving]         = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo...' }),
    ],
    content: initial?.content?.rendered ?? '',
    editorProps: {
      attributes: {
        class: 'prose-spasso min-h-[400px] focus:outline-none px-1',
      },
    },
  })

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(slugify(val))
  }

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Erro no upload da imagem')
    const { url } = await res.json()
    return url
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await uploadImage(file)
      setCoverUrl(url)
    } catch {
      setError('Erro ao fazer upload da imagem.')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleImageInsert() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file || !editor) return
      try {
        const url = await uploadImage(file)
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      } catch {
        setError('Erro ao inserir imagem.')
      }
    }
    input.click()
  }

  async function save(status: 'draft' | 'published' | 'archived') {
    if (!title.trim()) { setError('Título obrigatório.'); return }
    if (!slug.trim())  { setError('Slug obrigatório.'); return }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      id: initial?.id,
      title,
      slug,
      excerpt,
      category_slug: category || null,
      content_type: contentType,
      source_type: sourceType,
      origin_badge: originBadge || null,
      columnist_id: columnistId || null,
      featured_image_url: coverUrl || null,
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      status,
      content: { rendered: editor?.getHTML() ?? '' },
    }

    try {
      const res = await fetch(
        isEditing ? `/api/artigos/${initial!.id}` : '/api/artigos',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg ?? 'Erro ao salvar')
      }
      const { id } = await res.json()
      setSuccess(status === 'published' ? 'Publicado!' : 'Salvo como rascunho.')
      if (!isEditing) router.push(`/admin/artigos/${id}/editar`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  const toolbarBtn = useCallback((active: boolean) =>
    `px-2 py-1 text-xs rounded font-medium transition-colors ${
      active ? 'bg-[#f5821f] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`, [])

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Editor principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Título */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título do artigo"
            className="w-full text-2xl font-bold border-0 focus:outline-none placeholder:text-gray-300"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">Slug:</span>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              className="flex-1 text-xs text-gray-500 border-0 focus:outline-none bg-transparent"
              placeholder="slug-do-artigo"
            />
          </div>
        </div>

        {/* Toolbar TipTap */}
        <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-wrap">
          <button onClick={() => editor?.chain().focus().toggleBold().run()} className={toolbarBtn(!!editor?.isActive('bold'))}>N</button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={toolbarBtn(!!editor?.isActive('italic'))}><em>I</em></button>
          <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarBtn(!!editor?.isActive('heading', { level: 2 }))}>H2</button>
          <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={toolbarBtn(!!editor?.isActive('heading', { level: 3 }))}>H3</button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={toolbarBtn(!!editor?.isActive('bulletList'))}>• Lista</button>
          <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={toolbarBtn(!!editor?.isActive('orderedList'))}>1. Lista</button>
          <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={toolbarBtn(!!editor?.isActive('blockquote'))}>❝</button>
          <button onClick={handleImageInsert} className={toolbarBtn(false)}>🖼 Imagem</button>
          <button onClick={() => editor?.chain().focus().undo().run()} className={toolbarBtn(false)}>↩</button>
          <button onClick={() => editor?.chain().focus().redo().run()} className={toolbarBtn(false)}>↪</button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white p-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-gray-100 overflow-y-auto flex flex-col shrink-0">
        {/* Actions */}
        <div className="p-4 border-b border-gray-100 space-y-2">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          {success && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">{success}</p>}

          <button
            onClick={() => save('published')}
            disabled={saving}
            className="w-full py-2 bg-[#f5821f] text-white font-semibold text-sm rounded-lg hover:bg-[#c87800] transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : isEditing ? 'Atualizar e publicar' : 'Publicar'}
          </button>
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="w-full py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            Salvar rascunho
          </button>
          {isEditing && (
            <button
              onClick={() => save('archived')}
              disabled={saving}
              className="w-full py-2 text-red-600 font-medium text-xs rounded-lg hover:bg-red-50 transition-colors"
            >
              Arquivar
            </button>
          )}
        </div>

        {/* Campos */}
        <div className="p-4 space-y-4 flex-1">
          <Field label="Categoria">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              <option value="">— Sem categoria —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>

          {category === 'colunistas' && columnists.length > 0 && (
            <Field label="Colunista">
              <select value={columnistId} onChange={(e) => setColumnistId(e.target.value)} className={selectCls}>
                <option value="">— Selecionar colunista —</option>
                {columnists.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Tipo de conteúdo">
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={selectCls}>
              <option value="news">Notícia</option>
              <option value="opinion">Opinião</option>
              <option value="special">Especial</option>
              <option value="press_release">Press Release</option>
              <option value="advertising">Publicidade</option>
              <option value="aggregated">Agregado</option>
            </select>
          </Field>

          <Field label="Fonte">
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={selectCls}>
              <option value="original">Original</option>
              <option value="collaborator">Colaborador</option>
              <option value="press_release">Assessoria</option>
              <option value="aggregated">Agregado</option>
            </select>
          </Field>

          <Field label="Badge de origem (assessoria)">
            <input value={originBadge} onChange={(e) => setOriginBadge(e.target.value)}
              placeholder="Prefeitura de Sumaré..." className={inputCls} />
          </Field>

          <Field label="Imagem de capa">
            {coverUrl && (
              <img src={coverUrl} alt="capa" className="w-full aspect-video object-cover rounded mb-2" />
            )}
            <label className={`block w-full text-center py-2 text-xs font-medium rounded border border-dashed border-gray-300 cursor-pointer hover:border-[#f5821f] transition-colors ${uploadingCover ? 'opacity-60' : ''}`}>
              {uploadingCover ? 'Enviando...' : 'Selecionar imagem'}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
            </label>
            {coverUrl && (
              <button onClick={() => setCoverUrl('')} className="text-xs text-red-500 mt-1 hover:underline">Remover</button>
            )}
          </Field>

          <Field label="Resumo (excerpt)">
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              rows={3} placeholder="Resumo do artigo..." className={`${inputCls} resize-none`} />
          </Field>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SEO</p>
            <Field label="Título SEO">
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title} className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">{seoTitle.length}/60</p>
            </Field>
            <Field label="Descrição SEO">
              <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)}
                rows={3} placeholder="Descrição para buscadores..." className={`${inputCls} resize-none`} />
              <p className="text-xs text-gray-400 mt-1">{seoDesc.length}/160</p>
            </Field>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f]/40'
const selectCls = `${inputCls} bg-white`
