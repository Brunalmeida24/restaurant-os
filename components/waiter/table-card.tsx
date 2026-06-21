"use client"

type TableStatus = "free" | "occupied" | "reserved" | "cleaning"

interface TableData {
  id: string
  number: number
  capacity: number
  location: string | null
  status: TableStatus
}

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string }> = {
  free:     { label: "Livre",     color: "#34D399", bg: "#0F2A20" },
  occupied: { label: "Ocupada",   color: "#F0654A", bg: "#3A1810" },
  reserved: { label: "Reservada", color: "#60A5FA", bg: "#102540" },
  cleaning: { label: "Limpeza",   color: "#87887F", bg: "#1E1F1E" },
}

export function TableCard({
  table,
  onClick,
}: {
  table: TableData
  onClick: () => void
}) {
  const sc = statusConfig[table.status]
  const disabled = table.status === "cleaning"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl p-4 text-left transition-all"
      style={{
        background: "#1A1B1A",
        border: `1px solid ${table.status === "occupied" ? sc.color : "#262725"}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: table.status === "occupied" ? `0 0 14px ${sc.color}22` : "none",
      }}
    >
      <div className="flex justify-between items-start mb-2.5">
        <span
          className="text-2xl font-bold"
          style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}
        >
          {String(table.number).padStart(2, "0")}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: sc.bg, color: sc.color }}
        >
          {sc.label}
        </span>
      </div>
      <div className="text-xs" style={{ color: "#4A4B47" }}>
        {table.location} · {table.capacity} lugares
      </div>
    </button>
  )
}