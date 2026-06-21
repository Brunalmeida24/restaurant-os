import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OwnerSidebar } from "@/components/owner/sidebar"
import { CardapioClient } from "@/components/owner/cardapio-client"

export default async function CardapioPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") redirect("/login")

  const { data: categories } = await supabase
    .from("categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", profile.restaurant_id)
    .order("sort_order")

  return (
    <div className="flex" style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <OwnerSidebar
        ownerName={profile.name}
        restaurantName={profile.restaurants?.name ?? "Restaurant"}
      />
      <CardapioClient
        initialCategories={categories ?? []}
        restaurantId={profile.restaurant_id}
      />
    </div>
  )
}