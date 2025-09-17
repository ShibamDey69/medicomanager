"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, FileText, MessageSquare, User, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50)
  }
}

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  if (pathname === "/" || pathname === "/landing" || pathname === "/profile-setup" || pathname === "/login" || !isAuthenticated) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto max-w-12xl">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
  
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={triggerHaptic}
                className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-2 rounded-2xl transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}