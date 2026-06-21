import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OwnerSidebar } from "@/components/owner/sidebar"
import { EquipeClient } from "@/components/owner/equipe-client"

export default async function EquipePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") redirect("/login")

  const { data: employees } = await supabase
    .from("profiles")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("created_at")

  return (
    <div className="flex" style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <OwnerSidebar
        ownerName={profile.name}
        restaurantName={profile.restaurants?.name ?? "Restaurant"}
      />
      <EquipeClient initialEmployees={employees ?? []} />
    </div>
  )
}