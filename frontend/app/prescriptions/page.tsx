"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { Search, Calendar, User, Pill, Plus, ArrowLeft, FileText, Clock } from "lucide-react"

interface Prescription {
  id: string
  doctor: string
  date: string
  medicines: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
    instruction: string
    status: "active" | "completed" | "expired"
  }>
  status: "active" | "completed" | "expired"
  specialty: string
  createdAt: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function PrescriptionsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDoctor, setFilterDoctor] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user ID from localStorage
  const getUserId = (): string | null => {
    if (typeof window === "undefined") return null
    const authData = localStorage.getItem("medico_auth")
    if (!authData) return null
    try {
      const parsed = JSON.parse(authData)
      return parsed.userId || null
    } catch {
      return null
    }
  }

  // Fetch prescriptions from backend
  const fetchPrescriptions = async () => {
    const userId = getUserId()
    if (!userId) {
      setError("User ID not found. Please log in again.")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/prescriptions/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch prescriptions: ${response.status}`)
      }

      const data = await response.json()
      
      if (data && data.data) {
        // Transform data to match our UI expectations
        const transformedData = data.data.map((prescription: any) => ({
          id: prescription.id,
          doctor: prescription.doctor || "Unknown Doctor",
          date: prescription.date || new Date().toISOString(),
          medicines: prescription.medicines && Array.isArray(prescription.medicines)
            ? prescription.medicines.map((med: any) => ({
                name: med.name || "Unknown Medicine",
                dosage: med.dosage || "",
                frequency: med.frequency || "as directed",
                duration: med.duration || "",
                instruction: med.instruction || "",
                status: med.status || "active"
              }))
            : [],
          status: prescription.status || "active",
          specialty: prescription.specialty || "General",
          createdAt: prescription.createdAt || new Date().toISOString()
        }))
        
        setPrescriptions(transformedData)
      }
    } catch (err: any) {
      console.error("Error fetching prescriptions:", err)
      setError(err.message || "Failed to load prescriptions")
    } finally {
      setIsLoading(false)
    }
  }

  // Load prescriptions on component mount
  useEffect(() => {
    fetchPrescriptions()
  }, [])

  // Get unique doctors for filter
  const uniqueDoctors = Array.from(new Set(prescriptions.map((p) => p.doctor)))

  // Filter and sort prescriptions
  const filteredPrescriptions = prescriptions
    .filter((prescription) => {
      const matchesSearch =
        prescription.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some((med) => med.name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesDoctor = filterDoctor === "all" || prescription.doctor === filterDoctor
      const matchesStatus = filterStatus === "all" || prescription.status === filterStatus

      return matchesSearch && matchesDoctor && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "doctor":
          return a.doctor.localeCompare(b.doctor)
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
      case "expired":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-3 h-3 mr-1" />
      case "completed":
        return <FileText className="w-3 h-3 mr-1" />
      case "expired":
        return <Clock className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading prescriptions...</p>
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
                fetchPrescriptions()
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="border-b border-border/20 bg-gradient-to-r from-card/90 via-card/70 to-card/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl hover:bg-muted/50 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <motion.div
                  animate={{
                    rotate: [0, 2, -2, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="relative w-8 h-8"
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-primary/40 transition-all duration-300">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotateY: [0, 180, 360],
                      }}
                      transition={{
                        scale: {
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        },
                        rotateY: {
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        },
                      }}
                    >
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-0.5 left-1/2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-md shadow-green-500/50 transform -translate-x-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 10,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-0.5 w-1 h-1 bg-blue-500 rounded-full shadow-md shadow-blue-500/50 transform -translate-y-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                    }}
                    className="absolute -inset-1 border border-primary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.div>
              </motion.div>

              <h1 className="text-lg font-semibold text-foreground">MedicoManager</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle className="rounded-2xl" />
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        <div className="container mx-auto px-6 py-8 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl bg-card/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by doctor name, medication, or prescription details..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Doctor</label>
                      <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                        <SelectTrigger className="rounded-xl border-border/50 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="All Doctors" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Doctors</SelectItem>
                          {uniqueDoctors.map((doctor) => (
                            <SelectItem key={doctor} value={doctor}>
                               {doctor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="rounded-xl border-border/50 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Sort by</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="rounded-xl border-border/50 bg-background/50 hover:bg-background transition-colors">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="date-desc">Newest First</SelectItem>
                          <SelectItem value="date-asc">Oldest First</SelectItem>
                          <SelectItem value="doctor">Doctor Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredPrescriptions.length}</span> prescription
                {filteredPrescriptions.length !== 1 ? "s" : ""} found
              </p>
              {(searchTerm || filterDoctor !== "all" || filterStatus !== "all") && (
                <Badge variant="secondary" className="text-xs rounded-full">
                  Filtered
                </Badge>
              )}
            </div>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl bg-card/60 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl flex items-center justify-center">
                    <Pill className="w-10 h-10 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {prescriptions.length === 0 ? "No prescriptions yet" : "No matching prescriptions"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                    {prescriptions.length === 0
                      ? "Start managing your medical prescriptions by uploading your first prescription document."
                      : "Try adjusting your search criteria or filter options to find the prescriptions you're looking for."}
                  </p>
                  <Button
                    onClick={() => router.push("/upload")}
                    className="rounded-xl px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Prescription
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredPrescriptions.map((prescription, index) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    className="border-0 shadow-lg shadow-black/5 rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-sm group"
                    onClick={() => router.push(`/prescriptions/${prescription.id}`)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-foreground truncate">
                               {prescription.doctor}
                            </CardTitle>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(prescription.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {prescription.specialty}
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(
                            prescription.status,
                          )}`}
                        >
                          <div className="flex items-center">
                            {getStatusIcon(prescription.status)}
                            <span className="capitalize">{prescription.status}</span>
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Medications</p>
                          <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">
                            {prescription.medicines.length} item
                            {prescription.medicines.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {prescription.medicines.slice(0, 2).map((medicine, idx) => (
                            <div key={idx} className="text-sm bg-muted/30 px-3 py-2 rounded-xl border border-border/30">
                              <div className="font-medium text-foreground truncate">{medicine.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {medicine.dosage} • {medicine.frequency}
                              </div>
                              {medicine.instruction && (
                                <div className="text-xs text-muted-foreground mt-1 italic">
                                  {medicine.instruction}
                                </div>
                              )}
                            </div>
                          ))}
                          {prescription.medicines.length > 2 && (
                            <div className="text-sm text-muted-foreground text-center py-2 bg-muted/20 rounded-xl border border-dashed border-border/40">
                              +{prescription.medicines.length - 2} more medication
                              {prescription.medicines.length - 2 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}