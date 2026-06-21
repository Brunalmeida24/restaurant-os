import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OwnerSidebar } from "@/components/owner/sidebar"
import { MesasConfigClient } from "@/components/owner/mesas-config-client"

export default async function MesasConfigPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") redirect("/login")

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("number")

  return (
    <div className="flex" style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <OwnerSidebar
        ownerName={profile.name}
        restaurantName={profile.restaurants?.name ?? "Restaurant"}
      />
      <MesasConfigClient
        initialTables={tables ?? []}
        restaurantId={profile.restaurant_id}
      />
    </div>
  )
}