"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, Camera, Edit2, Save, User, X, Heart, Shield, Dna, QrCode, Share2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock user data - in real app this would come from context/API
  const [isEditing, setIsEditing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    dateOfBirth: "1990-05-15",
    age: 34,
    gender: "male",
    bloodGroup: "O+",
    chronicDiseases: "Hypertension, Type 2 Diabetes",
    allergies: "Penicillin, Shellfish",
    familialIssues: "Family history of heart disease and diabetes",
    avatar: "/professional-medical-patient-avatar.jpg",
  })

  const [editData, setEditData] = useState(profileData)

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleDateOfBirthChange = (value: string) => {
    const age = calculateAge(value)
    setEditData((prev) => ({
      ...prev,
      dateOfBirth: value,
      age: age,
    }))
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setEditData((prev) => ({
          ...prev,
          avatar: result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setProfileData(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(profileData)
    setIsEditing(false)
  }

  // Create QR pattern - simplified but more realistic
  const createQRPattern = (size: number) => {
    const pattern = []
    for (let i = 0; i < size * size; i++) {
      const row = Math.floor(i / size)
      const col = i % size
      
      // Create finder patterns (3 corner squares)
      const isTopLeftFinder = row < 7 && col < 7
      const isTopRightFinder = row < 7 && col >= size - 7
      const isBottomLeftFinder = row >= size - 7 && col < 7
      
      // Create timing patterns
      const isHorizontalTiming = row === 6 && col > 7 && col < size - 8
      const isVerticalTiming = col === 6 && row > 7 && row < size - 8
      
      // Create data pattern (pseudo-random based on position)
      const isDataPattern = (row + col) % 3 === 0 || (row * col) % 7 === 0
      
      const shouldFill = isTopLeftFinder || isTopRightFinder || isBottomLeftFinder || 
                        isHorizontalTiming || isVerticalTiming || 
                        (!isTopLeftFinder && !isTopRightFinder && !isBottomLeftFinder && isDataPattern)
      
      pattern.push(shouldFill)
    }
    return pattern
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
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.4, 0.25, 1]
      }
    }
  }

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
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
                    repeat: Infinity,
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
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                      }}
                    >
                      <User className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                  </div>

                  {/* Enhanced orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg shadow-green-500/50 transform -translate-x-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 transform -translate-y-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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
                      repeat: Infinity,
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
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5
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
              <motion.div
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.92 }}
                className="relative"
              >
                <ThemeToggle className="rounded-2xl hover:shadow-md shadow-black/10 transition-all duration-300" />
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        <div className="container mx-auto px-6 py-8 max-w-3xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              className="relative"
            >
              <Card className="rounded-3xl border-2 border-border/50 shadow-2xl shadow-black/5 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-sm overflow-hidden relative">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-primary/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-radial from-primary/8 to-transparent rounded-full translate-x-12 translate-y-12" />

                {/* QR Code positioned in top-right corner */}
                <motion.div
                  className="absolute top-6 right-6 z-20"
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group cursor-pointer"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-md border-2 border-border/30 rounded-2xl p-2 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-primary/50">
                      {/* Sample QR code pattern */}
                      <div className="w-full h-full grid grid-cols-8 gap-px opacity-90">
                        {/* Simple QR Code pattern simulation */}
                        {createQRPattern(8).map((shouldFill, i) => (
                          <div
                            key={i}
                            className={`aspect-square rounded-sm ${
                              shouldFill ? "bg-foreground" : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-foreground text-background text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                        Profile QR Code
                      </div>
                    </div>

                    {/* Animated scanning line effect */}
                    <motion.div
                      className="absolute inset-2 bg-gradient-to-b from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 rounded-xl pointer-events-none"
                      animate={{
                        y: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </motion.div>

                <CardHeader className="text-center pb-8 pt-8 relative z-10">
                  <motion.div 
                    className="relative mx-auto"
                    variants={itemVariants}
                  >
                    <motion.div 
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-primary/30 bg-muted shadow-2xl shadow-black/10 relative"
                      whileHover={{ 
                        scale: 1.05, 
                        borderColor: "hsl(var(--primary))",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={editData.avatar || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      {/* Avatar overlay effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                    
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 shadow-xl shadow-black/20 hover:shadow-2xl border-2 border-background bg-gradient-to-br from-secondary to-secondary/80"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera className="w-5 h-5" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-2xl sm:text-3xl text-foreground mt-6 font-bold">
                      {profileData.name}
                    </CardTitle>
                    <motion.p 
                      className="text-muted-foreground text-lg mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {profileData.age} years old • {profileData.gender === "male" ? "Male" : profileData.gender === "female" ? "Female" : "Other"}
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
                        Blood Type: {profileData.bloodGroup}
                      </span>
                    </motion.div>
                  </motion.div>
                </CardHeader>

                <CardContent className="space-y-8 relative z-10">
                  {/* Enhanced Action Buttons */}
                  <motion.div 
                    className="flex justify-center gap-4"
                    variants={itemVariants}
                  >
                    <AnimatePresence mode="wait">
                      {!isEditing ? (
                        <motion.div
                          key="edit"
                          className="flex gap-3"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={() => setIsEditing(true)} 
                              className="rounded-2xl px-8 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Edit2 className="w-5 h-5 mr-3" />
                              Edit Profile
                            </Button>
                          </motion.div>
                          
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              variant="outline"
                              onClick={() => setShowQR(!showQR)}
                              className="rounded-2xl px-6 py-3 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm hover:bg-muted/50 shadow-lg hover:shadow-xl transition-all duration-300 border-2"
                            >
                              <QrCode className="w-5 h-5 mr-2" />
                              {showQR ? "Hide QR" : "Show QR"}
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
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={handleSave} 
                              className="rounded-2xl px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Save className="w-5 h-5 mr-3" />
                              Save Changes
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
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

                  {/* QR Code Expanded View */}
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="flex justify-center"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-md border-2 border-border/30 rounded-3xl p-6 shadow-2xl"
                        >
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                              <Share2 className="w-5 h-5 text-primary" />
                              Emergency Profile QR Code
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Scan to access emergency medical information
                            </p>
                          </div>
                          
                          {/* Large QR Code */}
                          <div className="w-48 h-48 mx-auto bg-white p-4 rounded-2xl border-2 border-border/20 shadow-inner">
                            <div className="w-full h-full grid grid-cols-21 gap-px">
                              {/* Enhanced QR Code pattern */}
                              {createQRPattern(21).map((shouldFill, i) => (
                                <motion.div
                                  key={i}
                                  className={`aspect-square ${
                                    shouldFill ? "bg-gray-900" : "bg-transparent"
                                  }`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: i * 0.001, duration: 0.1 }}
                                />
                              ))}
                            </div>
                          </div>
                          
                          {/* QR Info */}
                          <motion.div 
                            className="mt-4 text-center space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full inline-block">
                              Emergency Contact • Blood Type: {profileData.bloodGroup}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Contains: Name, Blood Group, Allergies, Emergency Info
                            </p>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Enhanced Profile Information */}
                  <motion.div 
                    className="grid gap-8"
                    variants={containerVariants}
                  >
                    {/* Basic Information Section */}
                    <motion.div 
                      className="space-y-6"
                      variants={itemVariants}
                    >
                      <div className="flex items-center space-x-3 border-b border-border/50 pb-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                          {isEditing ? (
                            <Input
                              id="name"
                              value={editData.name}
                              onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                              className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                              {profileData.name}
                            </p>
                          )}
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="dob" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
                          {isEditing ? (
                            <Input
                              id="dob"
                              type="date"
                              value={editData.dateOfBirth}
                              onChange={(e) => handleDateOfBirthChange(e.target.value)}
                              className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                              {new Date(profileData.dateOfBirth).toLocaleDateString()}
                            </p>
                          )}
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Age</Label>
                          <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm">
                            {editData.age} years
                          </p>
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="gender" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gender</Label>
                          {isEditing ? (
                            <Select
                              value={editData.gender}
                              onValueChange={(value) => setEditData((prev) => ({ ...prev, gender: value }))}
                            >
                              <SelectTrigger className="rounded-2xl border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-3 rounded-2xl border border-border/30 backdrop-blur-sm capitalize">
                              {profileData.gender}
                            </p>
                          )}
                        </motion.div>

                        <motion.div 
                          className="space-y-3 sm:col-span-2"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="bloodGroup" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Blood Group</Label>
                          {isEditing ? (
                            <Select
                              value={editData.bloodGroup}
                              onValueChange={(value) => setEditData((prev) => ({ ...prev, bloodGroup: value }))}
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
                              {profileData.bloodGroup}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Enhanced Medical Information Section */}
                    <motion.div 
                      className="space-y-6"
                      variants={itemVariants}
                    >
                      <div className="flex items-center space-x-3 border-b border-border/50 pb-3">
                        <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Medical Information</h3>
                      </div>

                      <div className="space-y-6">
                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="chronic" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                            <Heart className="w-4 h-4 mr-2 text-red-500" />
                            Chronic Diseases
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="chronic"
                              value={editData.chronicDiseases}
                              onChange={(e) => setEditData((prev) => ({ ...prev, chronicDiseases: e.target.value }))}
                              placeholder="List any chronic conditions..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {profileData.chronicDiseases || "None reported"}
                            </p>
                          )}
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="allergies" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-orange-500" />
                            Allergies
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="allergies"
                              value={editData.allergies}
                              onChange={(e) => setEditData((prev) => ({ ...prev, allergies: e.target.value }))}
                              placeholder="List any known allergies..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {profileData.allergies || "None reported"}
                            </p>
                          )}
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Label htmlFor="familial" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center">
                            <Dna className="w-4 h-4 mr-2 text-purple-500" />
                            Familial Health Issues
                          </Label>
                          {isEditing ? (
                            <Textarea
                              id="familial"
                              value={editData.familialIssues}
                              onChange={(e) => setEditData((prev) => ({ ...prev, familialIssues: e.target.value }))}
                              placeholder="Family medical history..."
                              className="rounded-2xl min-h-[100px] border-2 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            />
                          ) : (
                            <p className="text-foreground bg-gradient-to-r from-muted/60 to-muted/40 px-4 py-4 rounded-2xl min-h-[100px] whitespace-pre-wrap border border-border/30 backdrop-blur-sm">
                              {profileData.familialIssues || "None reported"}
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
                        <div className="text-2xl font-bold text-primary">{profileData.age}</div>
                        <div className="text-sm text-muted-foreground">Years Old</div>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-red-500">{profileData.bloodGroup}</div>
                        <div className="text-sm text-muted-foreground">Blood Type</div>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-orange-500">
                          {profileData.allergies.split(',').filter(a => a.trim()).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Allergies</div>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-4 bg-gradient-to-br from-background/60 to-background/40 rounded-2xl border border-border/20"
                        whileHover={{ scale: 1.05, y: -3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="text-2xl font-bold text-green-500">
                          {profileData.chronicDiseases.split(',').filter(c => c.trim()).length}
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
              {!isEditing && !showQR && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="text-center mt-8 text-muted-foreground text-sm"
                >
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Tap "Edit Profile" to update your information or "Show QR" for emergency access
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