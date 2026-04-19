import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'

export const runtime = 'edge'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb      = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="font-extrabold text-[#f5821f] text-sm tracking-tight">
            SPASSO CIDADES
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">CMS Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin">📊 Dashboard</NavLink>
          <NavLink href="/admin/artigos">📝 Artigos</NavLink>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate mb-2">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#f5821f]/10 hover:text-[#f5821f] transition-colors"
    >
      {children}
    </Link>
  )
}
