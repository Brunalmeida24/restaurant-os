const ITEMS = [
  { name: "Filé ao Molho Madeira", qty: 24, revenue: "R$ 2.136" },
  { name: "Salmão Grelhado",       qty: 18, revenue: "R$ 1.692" },
  { name: "Cerveja Artesanal",     qty: 41, revenue: "R$ 984"   },
  { name: "Petit Gâteau",          qty: 15, revenue: "R$ 540"   },
]

export function TopItems() {
  return (
    <div
      className="rounded-[10px] p-[22px]"
      style={{ background: "#1A1B1A", border: "1px solid #26272566" }}
    >
      <div className="text-[13px] font-semibold mb-4" style={{ color: "#ECECE9" }}>
        Itens mais vendidos
      </div>

      <div className="flex flex-col">
        {ITEMS.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-3.5 py-2.5"
            style={{
              borderBottom: i < ITEMS.length - 1 ? "1px solid #1E1F1E" : "none",
            }}
          >
            <span
              className="text-xs w-4"
              style={{ color: "#4A4B47", fontFamily: "var(--font-mono)" }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[13px]" style={{ color: "#ECECE9" }}>
              {item.name}
            </span>
            <span className="text-xs" style={{ color: "#87887F" }}>
              {item.qty}x
            </span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}
            >
              {item.revenue}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}