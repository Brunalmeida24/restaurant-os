const METHODS = [
  { label: "Crédito",  pct: 48, value: "R$ 2.054" },
  { label: "Pix",      pct: 31, value: "R$ 1.327" },
  { label: "Débito",   pct: 14, value: "R$ 599"   },
  { label: "Dinheiro", pct: 7,  value: "R$ 300"   },
]

export function PaymentMethods() {
  return (
    <div
      className="rounded-[10px] p-[22px]"
      style={{ background: "#1A1B1A", border: "1px solid #26272566", width: 280 }}
    >
      <div className="text-[13px] font-semibold mb-[18px]" style={{ color: "#ECECE9" }}>
        Formas de pagamento
      </div>

      {METHODS.map((m, i) => (
        <div key={m.label} className={i < METHODS.length - 1 ? "mb-3.5" : ""}>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs" style={{ color: "#87887F" }}>{m.label}</span>
            <span
              className="text-xs"
              style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}
            >
              {m.value}
            </span>
          </div>
          <div className="rounded-sm h-[3px]" style={{ background: "#1E1F1E" }}>
            <div
              className="h-[3px] rounded-sm"
              style={{ width: `${m.pct}%`, background: i === 0 ? "#34D399" : "#4A4B47" }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}