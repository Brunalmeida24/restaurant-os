import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "RestaurantOS",
  description: "Gestão inteligente para restaurantes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181B",
              border: "1px solid #27272A",
              color: "#FAFAFA",
            },
          }}
        />
      </body>
    </html>
  )
}