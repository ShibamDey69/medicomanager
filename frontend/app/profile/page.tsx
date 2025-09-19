
"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, Edit2, Save, User, X, Heart, Shield, Dna } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function ProfilePage() {
  const router = useRouter()
  // Removed fileInputRef as avatar section is removed
  // State
  const [isEditing, setIsEditing] = useState(false)
  // Removed showQR state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any>({})
  const [editData, setEditData] = useState<any>({})

  // Get auth token from localStorage
  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null
    const authData = localStorage.getItem("medico_auth")
    if (!authData) return null
    try {
      const parsed = JSON.parse(authData)
      return parsed.authenticated ? parsed.phone : null
    } catch {
      return null
    }
  }

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

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Handle date of birth change - Ensures ISO format
  const handleDateOfBirthChange = (value: string) => {
    // Ensure the date is in ISO format (YYYY-MM-DD)
    const isoDate = new Date(value).toISOString().split('T')[0];
    const age = calculateAge(isoDate)
    setEditData((prev: any) => ({
      ...prev,
      DOB: isoDate,
      age: age,
    }))
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    setIsLoading(true)
    setError(null)
    const userId = getUserId()
    if (!userId) {
      setError("User ID not found. Please log in again.")
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookie-based auth
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.data) {
        // Transform data to match our UI expectations
        const transformedData = {
          ...data.data,
          name: data.data.name || "",
          // Ensure DOB is in ISO format
          DOB: data.data.DOB ? new Date(data.data.DOB).toISOString().split('T')[0] : "",
          age: data.data.DOB ? calculateAge(data.data.DOB) : 0,
          gender: data.data.gender || "",
          bloodGroup: data.data.bloodGroup || "",
          chronicDiseases: Array.isArray(data.data.chronicDiseases) 
            ? data.data.chronicDiseases.join(", ") 
            : data.data.chronicDiseases || "",
          allergies: Array.isArray(data.data.allergies) 
            ? data.data.allergies.join(", ") 
            : data.data.allergies || "",
          familialIssues: data.data.familialIssues || data.data.familialIssues || "",
          // Removed avatar field
          userId: userId
        }
        setProfileData(transformedData)
        setEditData(transformedData)
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async () => {
    const userId = getUserId()
    if (!userId) {
      setError("User ID not found. Please log in again.")
      return
    }
    try {
      // Transform data to match backend expectations
      const payload = {
        name: editData.name,
        DOB: new Date(editData.DOB),
        gender: editData.gender,
        bloodGroup: editData.bloodGroup,
        chronicDiseases: editData.chronicDiseases,
        allergies: editData.allergies,
        familialIssues: editData.familialIssues,
        // Removed avatar from payload
      }
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.data) {
        // Update local storage
        const authData = localStorage.getItem("medico_auth")
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            const updatedAuthData = {
              ...parsed,
              hasProfile: true,
            }
            localStorage.setItem("medico_auth", JSON.stringify(updatedAuthData))
          } catch (e) {
            console.error("Failed to update auth data:", e)
          }
        }
        // Transform response data
        const transformedData = {
          ...data.data,
          name: data.data.name || "",
          // Ensure DOB is in ISO format
          DOB: data.data.DOB ? new Date(data.data.DOB).toISOString().split('T')[0] : "",
          age: data.data.DOB ? calculateAge(data.data.DOB) : 0,
          gender: data.data.gender || "",
          bloodGroup: data.data.bloodGroup || "",
          chronicDiseases: Array.isArray(data.data.chronicDiseases) 
            ? data.data.chronicDiseases.join(", ") 
            : data.data.chronicDiseases || "",
          allergies: Array.isArray(data.data.allergies) 
            ? data.data.allergies.join(", ") 
            : data.data.allergies || "",
          familialIssues: data.data.familialIssues || data.data.familialIssues || "",
          // Removed avatar field
          userId: userId
        }
        setProfileData(transformedData)
        setEditData(transformedData)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile")
    }
  }

  // Create user profile (if it doesn't exist)
  const createProfile = async () => {
    const userId = getUserId()
    if (!userId) {
      setError("User ID not found. Please log in again.")
      return
    }
    try {
      // Transform data to match backend expectations
      const payload = {
        name: editData.name,
        DOB: editData.DOB,
        gender: editData.gender,
        bloodGroup: editData.bloodGroup,
        chronicDiseases: editData.chronicDiseases,
        allergies: editData.allergies,
        familialIssues: editData.familialIssues,
        // Removed avatar from payload
      }
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Failed to create profile: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.data) {
        // Update local storage
        const authData = localStorage.getItem("medico_auth")
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            const updatedAuthData = {
              ...parsed,
              hasProfile: true,
            }
            localStorage.setItem("medico_auth", JSON.stringify(updatedAuthData))
          } catch (e) {
            console.error("Failed to update auth data:", e)
          }
        }
        // Transform response data
        const transformedData = {
          ...data.data,
          name: data.data.name || "",
          // Ensure DOB is in ISO format
          DOB: data.data.DOB ? new Date(data.data.DOB).toISOString().split('T')[0] : "",
          age: data.data.DOB ? calculateAge(data.data.DOB) : 0,
          gender: data.data.gender || "",
          bloodGroup: data.data.bloodGroup || "",
          chronicDiseases: Array.isArray(data.data.chronicDiseases) 
            ? data.data.chronicDiseases.join(", ") 
            : data.data.chronicDiseases || "",
          allergies: Array.isArray(data.data.allergies) 
            ? data.data.allergies.join(", ") 
            : data.data.allergies || "",
          familialIssues: data.data.familialIssues || data.data.familialIssues || "",
          // Removed avatar field
          userId: userId
        }
        setProfileData(transformedData)
        setEditData(transformedData)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error("Error creating profile:", err)
      setError(err.message || "Failed to create profile")
    }
  }

  // Handle save
  const handleSave = async () => {
    // Check if profile exists by looking at profileData
    // If profileData has meaningful data, update it, otherwise create it
    if (profileData && profileData.name) {
      await updateProfile()
    } else {
      await createProfile()
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setEditData(profileData)
    setIsEditing(false)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  }

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  // Fetch profile on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
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
            <Button onClick={fetchUserProfile} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        {/* Enhanced Header with glassmorphism */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="border-b border-border/20 bg-gradient-to-r from-card/95 via-card/85 to-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/5"
        >
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            {/* Back Button with smooth hover */}
            <motion.div
              whileHover={{ scale: 1.08, x: -2 }}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="rounded-2xl hover:bg-muted/70 transition-all duration-300 hover:shadow-md shadow-black/10 group"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200 group-hover:-translate-x-0.5 transform" />
              </Button>
            </motion.div>
            {/* Enhanced Center Title */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              {/* Enhanced animated logo with particles */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative group cursor-pointer"
              >
                <motion.div
                  animate={{
                    rotate: [0, 3, -3, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="relative w-8 h-8"
                >
                  {/* Main logo with gradient */}
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 group-hover:shadow-xl">
                    <motion.div
                      animate={{
                        scale: [1, 1.15, 1],
                        rotateY: [0, 180, 360],
                      }}
                      transition={{
                        scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                        rotateY: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                      }}
                    >
                      <User className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                  </div>
                  {/* Enhanced orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg shadow-green-500/50 transform -translate-x-1/2" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 transform -translate-y-1/2" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -bottom-1 left-1/4 w-1 h-1 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-500/50" />
                  </motion.div>
                  {/* Animated rings */}
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0, 0.4, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                    }}
                    className="absolute -inset-2 border-2 border-primary/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0, 0.2, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                    className="absolute -inset-3 border border-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.div>
              </motion.div>
              {/* Enhanced Title */}
              <motion.h1
                className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                My Profile
              </motion.h1>
            </motion.div>
            {/* Enhanced Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.92 }} className="relative">
                <ThemeToggle className="rounded-2xl hover:shadow-md shadow-black/10 transition-all duration-300" />
              </motion.div>
            </motion.div>
          </div>
        </motion.header>
        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover" className="relative">
              <Card className="rounded-3xl border-2 border-border/50 shadow-2xl shadow-black/5 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-sm overflow-hidden relative">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-primary/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-radial from-primary/8 to-transparent rounded-full translate-x-12 translate-y-12" />
                
                <CardHeader className="text-center pb-8 pt-8 relative z-10">
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-2xl sm:text-3xl text-foreground mt-6 font-bold">
                      {profileData.name || "Set Your Name"}
                    </CardTitle>
                    <motion.p
                      className="text-muted-foreground text-lg mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {profileData.age ? `${profileData.age} years old` : ""} {" "}
                      {profileData.gender === "Male" ? "Male" : profileData.gender === "Female" ? "Female" : "Other"}
                    </motion.p>
                    {/* Blood type badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="inline-flex items-center mt-3 px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-full"
                    >
                      <Heart className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        Blood Type: {profileData.bloodGroup || "Not Set"}
                      </span>
                    </motion.div>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">
                  {/* Enhanced Action Buttons */}
                  <motion.div className="flex justify-center gap-4" variants={itemVariants}>
                    <AnimatePresence mode="wait">
                      {!isEditing ? (
                        <motion.div
                          key="edit"
                          className="flex gap-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => setIsEditing(true)}
                              className="rounded-2xl px-8 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Edit2 className="w-5 h-5 mr-3" />
                              Edit Profile
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="save-cancel"
                          className="flex gap-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={handleSave}
                              className="rounded-2xl px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Save className="w-5 h-5 mr-3" />
                              Save Changes
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              onClick={handleCancel}
                              className="rounded-2xl px-8 py-3 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm hover:bg-muted/50 shadow-lg hover:shadow-xl transition-all duration-300 border-2"
                            >
                              <X className="w-5 h-5 mr-3" />
                              Cancel
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  {/* Enhanced Profile Information */}
                  <motion.div className="grid gap-8" variants={containerVariants}>
                    {/* Basic Information Section */}
                    <motion.div className="space-y-6" variants={itemVariants}>
                      <div className="flex items-center space-x-3 border-b border-border/50 pb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="name"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                          >
                            Full Name
                          </Label>
                          {isEditing ? (
                            <Input
                              id="name"
                              value={editData.name || ""}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, name: e.target.value }))}
                              className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                              {profileData.name || "Not set"}
                            </p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="dob"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                          >
                            Date of Birth
                          </Label>
                          {isEditing ? (
                            <Input
                              id="dob"
                              type="date"
                              // Ensure value is in ISO format (YYYY-MM-DD)
                              value={editData.DOB || ""}
                              onChange={(e) => handleDateOfBirthChange(e.target.value)}
                              className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                              {profileData.DOB ? new Date(profileData.DOB).toLocaleDateString() : "Not set"}
                            </p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Age
                          </Label>
                          <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                            {profileData.age || "N/A"} years
                          </p>
                        </motion.div>
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="gender"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                          >
                            Gender
                          </Label>
                          {isEditing ? (
                            <Select
                              value={editData.gender || ""}
                              onValueChange={(value) => setEditData((prev: any) => ({ ...prev, gender: value }))}
                            >
                              <SelectTrigger className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm capitalize">
                              {profileData.gender || "Not set"}
                            </p>
                          )}
                        </motion.div>
                        <motion.div
                          className="space-y-3 sm:col-span-2"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label
                            htmlFor="bloodGroup"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide"
                          >
                            Blood Group
                          </Label>
                          {isEditing ? (
                            <Select
                              value={editData.bloodGroup || ""}
                              onValueChange={(value) => setEditData((prev: any) => ({ ...prev, bloodGroup: value }))}
                            >
                              <SelectTrigger className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A+">A+</SelectItem>
                                <SelectItem value="A-">A-</SelectItem>
                                <SelectItem value="B+">B+</SelectItem>
                                <SelectItem value="B-">B-</SelectItem>
                                <SelectItem value="AB+">AB+</SelectItem>
                                <SelectItem value="AB-">AB-</SelectItem>
                                <SelectItem value="O+">O+</SelectItem>
                                <SelectItem value="O-">O-</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                              {profileData.bloodGroup || "Not set"}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                    {/* Enhanced Medical Information Section */}
                    <motion.div className="space-y-6" variants={itemVariants}>
                      <div className="flex items-center space-x-3 border-b border-border/50 pb-3">
                        <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Medical Information</h3>
                      </div>
                      <div className="space-y-6">
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="chronic"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center"
                          >
                            <Heart className="w-4 h-4 mr-2 text-red-500" />
                            Chronic Diseases
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="chronic"
                              value={editData.chronicDiseases || ""}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, chronicDiseases: e.target.value }))}
                              placeholder="List any chronic conditions..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {editData.chronicDiseases || "None reported"}
                            </p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="allergies"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center"
                          >
                            <Shield className="w-4 h-4 mr-2 text-orange-500" />
                            Allergies
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="allergies"
                              value={editData.allergies || ""}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, allergies: e.target.value }))}
                              placeholder="List any known allergies..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {editData.allergies || "None reported"}
                            </p>
                          )}
                        </motion.div>
                        <motion.div className="space-y-3" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                          <Label
                            htmlFor="familial"
                            className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center"
                          >
                            <Dna className="w-4 h-4 mr-2 text-purple-500" />
                            Familial Health Issues
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="familial"
                              value={editData.familialIssues || ""}
                              onChange={(e) => setEditData((prev: any) => ({ ...prev, familialIssues: e.target.value }))}
                              placeholder="Family medical history..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {editData.familialIssues || "None reported"}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                  {/* Enhanced Quick Stats */}
                  <motion.div
                    variants={itemVariants}
                    className="mt-8 p-6 bg-gradient-to-br from-muted/30 to-muted/20 rounded-3xl border border-border/30 backdrop-blur-sm"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <motion.div
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-primary">{profileData.age || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">Years Old</div>
                      </motion.div>
                      <motion.div
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-red-500">{profileData.bloodGroup || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">Blood Type</div>
                      </motion.div>
                      <motion.div
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-orange-500">
                          {editData.allergies ? editData.allergies.split(",").filter((a: string) => a.trim()).length : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Allergies</div>
                      </motion.div>
                      <motion.div
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-green-500">
                          {editData.chronicDiseases ? editData.chronicDiseases.split(",").filter((c: string) => c.trim()).length : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Conditions</div>
                      </motion.div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Floating action hint */}
            <AnimatePresence>
              {!isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="text-center mt-8 text-muted-foreground text-sm"
                >
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    Tap "Edit Profile" to update your information
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
