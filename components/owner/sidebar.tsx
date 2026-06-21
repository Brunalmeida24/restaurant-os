"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

const navItems = [
  { id: "dashboard",  label: "Dashboard",  icon: "🏠", href: "/dashboard" },
  { id: "financeiro", label: "Financeiro", icon: "💰", href: "/financeiro" },
  { id: "cardapio",   label: "Cardápio",   icon: "🍽️", href: "/cardapio" },
  { id: "mesas-config", label: "Mesas",    icon: "🪑", href: "/mesas-config" },
  { id: "equipe",     label: "Equipe",     icon: "👥", href: "/equipe" },
  { id: "relatorio",  label: "Relatórios", icon: "📊", href: "/relatorio" },
]

export function OwnerSidebar({
  ownerName,
  restaurantName,
}: {
  ownerName: string
  restaurantName: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const initials = ownerName
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      className="w-[230px] h-screen flex flex-col flex-shrink-0"
      style={{ background: "#131413", borderRight: "1px solid #1E1F1E" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-[22px] pt-[26px] pb-[30px]">
        <span className="text-2xl">🍳</span>
        <div>
          <div className="text-[15px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            {restaurantName || "Restaurant"}
          </div>
          <div className="text-[10px] tracking-wide" style={{ color: "#4A4B47" }}>
            Painel administrativo
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3.5 gap-0.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all"
              style={{
                background: active ? "#1E211F" : "transparent",
                color: active ? "#ECECE9" : "#87887F",
                fontWeight: active ? 600 : 400,
                borderLeft: active ? "2px solid #34D399" : "2px solid transparent",
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto p-3.5">
        <div className="flex items-center gap-2.5 px-1 py-2.5">
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: "#0F2A20", color: "#34D399" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate" style={{ color: "#ECECE9" }}>
              {ownerName}
            </div>
            <div className="text-[10px]" style={{ color: "#4A4B47" }}>
              Proprietário
            </div>
          </div>
          <button onClick={handleLogout} title="Sair">
            <LogOut size={14} color="#4A4B47" />
          </button>
        </div>
      </div>
    </div>
  )
}