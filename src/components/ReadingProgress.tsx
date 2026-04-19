'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const total = article.offsetHeight
      const scrolled = Math.max(0, -rect.top)
      const pct = Math.min(100, (scrolled / total) * 100)
      setProgress(pct)
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
      <div
        className="h-full bg-[#dd8500] transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
