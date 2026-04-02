import { useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.07),_transparent_18%),linear-gradient(180deg,_#faf8f3_0%,_#f4efe8_100%)] text-stone-900">
      <aside className="hidden border-r border-stone-200/80 bg-[#f7f2eb]/88 backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:w-[292px] md:flex-col">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="h-full w-[312px] border-r border-stone-200 bg-[#f7f2eb]"
            onClick={(event) => event.stopPropagation()}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen((current) => !current)} />
        <main className="flex-1 overflow-y-auto pb-8">{children}</main>
      </div>
    </div>
  )
}
