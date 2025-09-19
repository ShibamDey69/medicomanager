"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import {
  LogOut,
  Upload,
  FileText,
  MessageSquare,
  User,
  Calendar,
  Clock,
  Pill,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  X,
  Plus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function for haptic feedback
const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50)
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [activeMedicines, setActiveMedicines] = useState<any[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID and phone from localStorage
  const getAuthData = () => {
    if (typeof window === "undefined") return { userId: null, phone: null }
    const authData = localStorage.getItem("medico_auth")
    if (!authData) return { userId: null, phone: null }
    try {
      const parsed = JSON.parse(authData)
      return {
        userId: parsed.userId || null,
        phone: parsed.authenticated ? parsed.phone : null
      }
    } catch {
      return { userId: null, phone: null }
    }
  }

  // Fetch user profile to get name
  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.data) {
        setUserName(data.data.name || "User")
        return data.data
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err)
      setError(err.message || "Failed to load user profile")
    }
  }

  // Fetch all prescriptions for user
  const fetchAllPrescriptions = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Failed to fetch prescriptions: ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.data) {
        return data.data
      }
      return []
    } catch (err: any) {
      console.error("Error fetching prescriptions:", err)
      throw err
    }
  }

  // Fetch medicines for a specific prescription
  const fetchMedicinesForPrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/medicines/prescription/${prescriptionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Failed to fetch medicines for prescription ${prescriptionId}: ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.data) {
        return data.data
      }
      return []
    } catch (err: any) {
      console.error(`Error fetching medicines for prescription ${prescriptionId}:`, err)
      return []
    }
  }

  // Process prescriptions and medicines to extract active medicines
  const processActiveMedicines = (prescriptions: any[]) => {
    const activeMeds: any[] = []
    
    // Filter for active prescriptions first
    const activePrescriptions = prescriptions.filter(p => p.status === "active")
    
    // For each active prescription, get its medicines and filter for active ones
    activePrescriptions.forEach(prescription => {
      if (prescription.medicines && Array.isArray(prescription.medicines)) {
        // If medicines are already included in the prescription response
        const activeMedicinesInPrescription = prescription.medicines.filter((med: any) => med.status === "active")
        activeMedicinesInPrescription.forEach((med: any) => {
          activeMeds.push({
            id: med.id,
            medicine: `${med.name} ${med.dosage}`,
            dosage: med.frequency ? `${med.frequency} (${med.instruction || 'as directed'})` : med.instruction || 'as directed',
            remaining: med.duration ? parseInt(med.duration) : 0,
            nextDose: "As prescribed",
            adherence: 95,
            prescriptionId: prescription.id,
            doctor: prescription.doctor
          })
        })
      }
    })
    
    return activeMeds
  }

  // Fetch recent prescriptions (all, not just active)
  const processRecentPrescriptions = (prescriptions: any[]) => {
    // Sort by date (newest first)
    const sortedPrescriptions = [...prescriptions].sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    // Transform data to match our UI expectations
    const transformedData = sortedPrescriptions.map((prescription: any) => ({
      id: prescription.id,
      doctor: prescription.doctor || "Unknown Doctor",
      specialty: prescription.specialty || "General",
      date: prescription.date || new Date().toISOString(),
      medicines: prescription.medicines && Array.isArray(prescription.medicines) 
        ? prescription.medicines.map((med: any) => `${med.name} ${med.dosage}`).join(", ")
        : "No medicines listed",
      status: prescription.status || "active",
    }))
    
    // Return only the 3 most recent
    return transformedData.slice(0, 3)
  }

  // Fetch all data for dashboard
  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch user profile
      await fetchUserProfile(userId)
      
      // Fetch all prescriptions
      const prescriptions = await fetchAllPrescriptions(userId)
      
      // Process active medicines
      const activeMeds = processActiveMedicines(prescriptions)
      setActiveMedicines(activeMeds)
      
      // Process recent prescriptions
      const recentPrescs = processRecentPrescriptions(prescriptions)
      setRecentPrescriptions(recentPrescs)
      
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message || "Failed to load dashboard data")
    }
  }

  // Logout function
  const handleLogout = () => {
    // Clear auth data from localStorage
    localStorage.removeItem("medico_auth")
    // Redirect to login page
    router.push("/login")
  }

  // Confirm logout
  const confirmLogout = () => {
    handleLogout()
    setShowLogoutModal(false)
  }

  // Fetch data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true)
      setError(null)
      
      // Get auth data
      const { userId, phone } = getAuthData()
      
      if (!userId || !phone) {
        setError("Authentication required. Please log in.")
        router.push("/login")
        return
      }
      
      setUserId(userId)
      
      try {
        // Fetch all dashboard data
        await fetchDashboardData(userId)
      } catch (err: any) {
        console.error("Error initializing dashboard:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeDashboard()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Show error state
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md">
            <p className="mb-4">{error}</p>
            <Button 
              onClick={() => {
                setIsLoading(true)
                const { userId } = getAuthData()
                if (userId) {
                  fetchDashboardData(userId).finally(() => setIsLoading(false))
                }
              }} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Header */}
        <header className="border-b border-border/20 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-primary/5">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {/* Brand Section - Enhanced with animations and better styling */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              {/* Animated logo with gradient background and pulse effect */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300">
                  <motion.span
                    animate={{
                      textShadow: [
                        "0 0 0px rgba(255,255,255,0)",
                        "0 0 8px rgba(255,255,255,0.8)",
                        "0 0 0px rgba(255,255,255,0)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="text-primary-foreground font-bold text-lg"
                  >
                    M
                  </motion.span>
                </div>
                {/* Animated ring around logo */}
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{
                    rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                  }}
                  className="absolute -inset-1 border border-primary/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.div>

              {/* Brand text with enhanced typography */}
              <div className="space-y-1">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                >
                  MedicoManager
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"
                  />
                  <p className="text-sm text-muted-foreground font-medium">
                    Welcome, <span className="text-primary font-semibold">{userName}</span>! 👋
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Actions Section - Enhanced with better spacing and animations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
             
              {/* Theme Toggle with enhanced styling */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle className="rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300" />
              </motion.div>

              {/* Logout Button with enhanced styling and confirmation */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    triggerHaptic()
                    setShowLogoutModal(true)
                  }}
                  className="rounded-2xl bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 border border-red-200/50 dark:border-red-800/30 transition-all duration-300 group"
                >
                  <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}>
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Optional: Progress bar or notification banner */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          />
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 space-y-8">
          {/* Quick Actions - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Button
                onClick={() => {
                  triggerHaptic()
                  router.push("/upload")
                }}
                className="h-20 md:h-24 rounded-3xl bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 hover:border-primary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <Upload className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">Upload Rx</span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic()
                  router.push("/prescriptions")
                }}
                className="h-20 md:h-24 rounded-3xl bg-secondary/50 hover:bg-secondary text-secondary-foreground border-2 border-secondary/20 hover:border-secondary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">View All</span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic()
                  router.push("/chat")
                }}
                className="h-20 md:h-24 rounded-3xl bg-secondary/50 hover:bg-secondary text-secondary-foreground border-2 border-secondary/20 hover:border-secondary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">AI Chat</span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic()
                  router.push("/profile")
                }}
                className="h-20 md:h-24 rounded-3xl bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 hover:border-primary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <User className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">Profile</span>
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Prescriptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-3xl border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-foreground">
                    <Pill className="w-5 h-5 mr-2 text-primary" />
                    Active Medications
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto space-y-3">
                  {activeMedicines.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Pill className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">No Active Medications</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You don't have any active prescriptions at the moment.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          triggerHaptic()
                          router.push("/prescriptions")
                        }}
                        className="rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Prescription
                      </Button>
                    </div>
                  ) : (
                    activeMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors duration-300"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{medicine.medicine}</h4>
                          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">Next dose: {medicine.nextDose}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="secondary" className="rounded-xl">
                            {medicine.remaining} left
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Prescriptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-3xl border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-foreground">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-primary" />
                      Recent Prescriptions
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        triggerHaptic()
                        router.push("/prescriptions")
                      }}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl flex items-center transition-all duration-300"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentPrescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">No Recent Prescriptions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your recent prescription history will appear here once you visit a doctor.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            triggerHaptic()
                            router.push("/prescriptions/upload")
                          }}
                          className="rounded-xl"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Prescription
                        </Button>
                      </div>
                    </div>
                  ) : (
                    recentPrescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors duration-300"
                        onClick={() => {
                          triggerHaptic()
                          router.push(`/prescriptions/${prescription.id}`)
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">{prescription.doctor}</h4>
                            <Badge
                              variant={prescription.status === "active" ? "default" : "secondary"}
                              className="rounded-xl text-xs"
                            >
                              {prescription.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{prescription.specialty}</p>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(prescription.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{prescription.medicines}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-card rounded-3xl border-2 border-border p-6 w-full max-w-md mx-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Confirm Logout</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogoutModal(false)}
                    className="rounded-xl hover:bg-muted/50 transition-colors duration-300"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Are you sure you want to logout? You'll need to sign in again to access your medical records and
                    prescriptions.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmLogout}
                    className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  )
}