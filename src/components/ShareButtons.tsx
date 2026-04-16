'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  url: string
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Share2 size={15} /> Compartilhar
      </span>

      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:opacity-90 transition-opacity"
      >
        WhatsApp
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
      >
        Facebook
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a1a1a] text-white hover:opacity-90 transition-opacity"
      >
        X / Twitter
      </a>

      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}
