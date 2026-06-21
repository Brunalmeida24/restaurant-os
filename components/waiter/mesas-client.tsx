"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"
import { TableCard } from "./table-card"

type TableStatus = "free" | "occupied" | "reserved" | "cleaning"

interface TableData {
  id: string
  number: number
  capacity: number
  location: string | null
  status: TableStatus
}

const locations = ["Todos", "Salão", "Varanda", "Bar"]

export function MesasClient({
  waiterName,
  tables,
}: {
  waiterName: string
  tables: TableData[]
}) {
  const router = useRouter()
  const [locationFilter, setLocationFilter] = useState("Todos")

  const filtered =
    locationFilter === "Todos"
      ? tables
      : tables.filter(t => t.location === locationFilter)

  const counts = {
    free: tables.filter(t => t.status === "free").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    reserved: tables.filter(t => t.status === "reserved").length,
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleTableClick = (table: TableData) => {
    router.push(`/mesas/${table.id}`)
  }

  const initials = waiterName
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3.5 sticky top-0 z-10"
        style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🍽️</span>
          <span className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
            Mesas
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: "#0F2A20", color: "#34D399" }}
          >
            {initials}
          </div>
          <span className="text-xs" style={{ color: "#87887F" }}>{waiterName}</span>
          <button onClick={handleLogout} title="Sair">
            <LogOut size={15} color="#4A4B47" />
          </button>
        </div>
      </div>

      {/* Location filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {locations.map(loc => (
          <button
            key={loc}
            onClick={() => setLocationFilter(loc)}
            className="px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all"
            style={{
              background: locationFilter === loc ? "#34D399" : "#1A1B1A",
              color: locationFilter === loc ? "#0A0B0A" : "#87887F",
              fontWeight: locationFilter === loc ? 700 : 400,
              border: `1px solid ${locationFilter === loc ? "#34D399" : "#262725"}`,
            }}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* Status summary */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "#1A1B1A", border: "1px solid #262725" }}>
          <span className="text-base font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>{counts.free}</span>
          <span className="text-xs" style={{ color: "#4A4B47" }}>Livres</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "#1A1B1A", border: "1px solid #262725" }}>
          <span className="text-base font-bold" style={{ color: "#F0654A", fontFamily: "var(--font-mono)" }}>{counts.occupied}</span>
          <span className="text-xs" style={{ color: "#4A4B47" }}>Ocupadas</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "#1A1B1A", border: "1px solid #262725" }}>
          <span className="text-base font-bold" style={{ color: "#60A5FA", fontFamily: "var(--font-mono)" }}>{counts.reserved}</span>
          <span className="text-xs" style={{ color: "#4A4B47" }}>Reservadas</span>
        </div>
      </div>

      {/* Tables grid */}
      <div
        className="grid gap-2.5 px-4 pb-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))" }}
      >
        {filtered.map(table => (
          <TableCard
            key={table.id}
            table={table}
            onClick={() => handleTableClick(table)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: "#4A4B47" }}>
          Nenhuma mesa encontrada nesse local
        </div>
      )}
    </div>
  )
}