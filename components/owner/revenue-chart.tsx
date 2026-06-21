const HOURS = ["11h","12h","13h","14h","15h","16h","17h","18h","19h","20h","21h","22h"]
const REVENUE = [420, 890, 1240, 980, 760, 1100, 1380, 1650, 1820, 1430, 1950, 1280]

export function RevenueChart() {
  const max = Math.max(...REVENUE)
  const peakIndex = REVENUE.indexOf(max)

  return (
    <div
      className="rounded-[10px] p-[22px] flex-1"
      style={{ background: "#1A1B1A", border: "1px solid #26272566" }}
    >
      <div className="flex justify-between items-baseline mb-[22px]">
        <span className="text-[13px] font-semibold" style={{ color: "#ECECE9" }}>
          Faturamento por hora
        </span>
        <span className="text-[11px]" style={{ color: "#4A4B47" }}>
          Hoje
        </span>
      </div>

      <div className="flex items-end gap-2" style={{ height: 130 }}>
        {REVENUE.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${(v / max) * 100}px`,
                minHeight: 3,
                background: i === peakIndex ? "#34D399" : "#2A2C2A",
              }}
            />
            <span className="text-[9px]" style={{ color: "#4A4B47" }}>
              {HOURS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}