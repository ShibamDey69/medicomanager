"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, ArrowRight, User, Upload, X, Plus, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]

const COMMON_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Arthritis",
  "Depression",
  "Anxiety",
  "Thyroid Disorder",
  "High Cholesterol",
]

const COMMON_ALLERGIES = [
  "Penicillin",
  "Aspirin",
  "Peanuts",
  "Shellfish",
  "Latex",
  "Dust Mites",
  "Pollen",
  "Pet Dander",
  "Eggs",
  "Milk",
]

const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50)
  }
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { updateProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    chronicDiseases: [] as string[],
    allergies: [] as string[],
    familialHealthIssues: "",
    previousOperations: "",
    avatar: "",
  })

  const [customAllergy, setCustomAllergy] = useState("")
  const [customCondition, setCustomCondition] = useState("")

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      setFormData((prev) => ({ ...prev, age: age.toString() }))
    }
  }, [formData.dateOfBirth])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayToggle = (field: "chronicDiseases" | "allergies", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
    }))
    triggerHaptic()
  }

  const addCustomAllergy = useCallback(() => {
    const trimmedAllergy = customAllergy.trim()
    if (trimmedAllergy && !formData.allergies.some(allergy => 
      allergy.toLowerCase() === trimmedAllergy.toLowerCase()
    )) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, trimmedAllergy],
      }))
      setCustomAllergy("")
      triggerHaptic()
    }
  }, [customAllergy, formData.allergies])

  const addCustomCondition = useCallback(() => {
    const trimmedCondition = customCondition.trim()
    if (trimmedCondition && !formData.chronicDiseases.some(condition => 
      condition.toLowerCase() === trimmedCondition.toLowerCase()
    )) {
      setFormData((prev) => ({
        ...prev,
        chronicDiseases: [...prev.chronicDiseases, trimmedCondition],
      }))
      setCustomCondition("")
      triggerHaptic()
    }
  }, [customCondition, formData.chronicDiseases])

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const canProceedStep1 = formData.name && formData.dateOfBirth && formData.gender
  const canProceedStep2 = formData.bloodGroup

  const handleNext = () => {
    triggerHaptic()
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    triggerHaptic()
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    triggerHaptic()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      updateProfile({
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        chronicDiseases: formData.chronicDiseases,
        allergies: formData.allergies,
        familialHealthIssues: formData.familialHealthIssues ? [formData.familialHealthIssues] : [],
        previousOperations: formData.previousOperations,
        avatar: formData.avatar,
      })

      setIsLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  const steps = [
    { number: 1, title: "Basic Info", description: "Personal details" },
    { number: 2, title: "Medical Info", description: "Health information" },
    { number: 3, title: "Complete", description: "Review & finish" },
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-primary/5"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHaptic()
                currentStep === 1 ? router.push("/login") : handleBack()
              }}
              className="rounded-2xl hover:bg-accent/80 transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              {/* Enhanced animated logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                {/* Main logo container */}
                <motion.div
                  animate={{
                    rotate: [0, 2, -2, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-12 h-12"
                >
                  {/* Main logo */}
                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/90 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotateY: [0, 180, 360],
                      }}
                      transition={{
                        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                      }}
                    >
                      <User className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                  </div>

                  {/* Orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-green-500 rounded-full shadow-md shadow-green-500/50 transform -translate-x-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-md shadow-blue-500/50 transform -translate-y-1/2" />
                  </motion.div>

                  {/* Pulsing ring on hover */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    className="absolute -inset-2 border border-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.div>
              </motion.div>

              <div className="space-y-1">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                >
                  MedicoManager
                </motion.h1>
                
                {/* Profile setup indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="h-4 flex items-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex items-center space-x-1"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Profile Setup
                    </span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ThemeToggle className="rounded-xl hover:scale-105 transition-transform duration-200" />
            </motion.div>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Progress Steps */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4 relative">
              {/* Progress Line Background */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 z-0" />
              {/* Active Progress Line */}
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-700 ease-out z-10"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
              
              {steps.map((step, index) => {
                const isActive = currentStep >= step.number
                const isCurrent = currentStep === step.number
                
                return (
                  <motion.div 
                    key={step.number} 
                    variants={itemVariants}
                    className="flex items-center relative z-20"
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                    >
                      {step.number}
                    </motion.div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${
                          currentStep > step.number ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">{steps[currentStep - 1].title}</h2>
              <p className="text-muted-foreground text-sm">{steps[currentStep - 1].description}</p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl rounded-2xl bg-card/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="rounded-2xl h-12 border-border bg-background/50 focus:bg-background transition-all duration-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-sm font-medium text-foreground">
                            Date of Birth *
                          </Label>
                          <Input
                            id="dob"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                            className="rounded-2xl h-12 border-border bg-background/50 focus:bg-background transition-all duration-200"
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age" className="text-sm font-medium text-foreground">
                            Age
                          </Label>
                          <Input
                            id="age"
                            placeholder="Auto-calculated"
                            value={formData.age}
                            readOnly
                            className="rounded-2xl h-12 border-border bg-muted"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                          Gender *
                        </Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                          <SelectTrigger className="rounded-2xl h-12 border-border bg-background/50 focus:bg-background">
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {GENDERS.map((gender) => (
                              <SelectItem key={gender} value={gender} className="rounded-lg">
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                          Blood Group *
                        </Label>
                        <Select
                          value={formData.bloodGroup}
                          onValueChange={(value) => handleInputChange("bloodGroup", value)}
                        >
                          <SelectTrigger className="rounded-2xl h-12 border-border bg-background/50 focus:bg-background">
                            <SelectValue placeholder="Select your blood group" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {BLOOD_GROUPS.map((group) => (
                              <SelectItem key={group} value={group} className="rounded-lg">
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          Chronic Diseases (if any)
                        </Label>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {COMMON_CONDITIONS.map((condition) => (
                              <Badge
                                key={condition}
                                variant={formData.chronicDiseases.includes(condition) ? "default" : "outline"}
                                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105 ${
                                  formData.chronicDiseases.includes(condition)
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "hover:bg-accent"
                                }`}
                                onClick={() => handleArrayToggle("chronicDiseases", condition)}
                              >
                                {condition}
                                {formData.chronicDiseases.includes(condition) && (
                                  <Check className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                            
                            {formData.chronicDiseases
                              .filter(condition => !COMMON_CONDITIONS.includes(condition))
                              .map((condition) => (
                                <Badge
                                  key={condition}
                                  className="cursor-pointer rounded-xl px-3 py-1.5 text-xs bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-all duration-200"
                                  onClick={() => handleArrayToggle("chronicDiseases", condition)}
                                >
                                  {condition}
                                  <X className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom condition..."
                              value={customCondition}
                              onChange={(e) => setCustomCondition(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addCustomCondition()}
                              className="rounded-xl h-10 border-border bg-background"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addCustomCondition}
                              className="rounded-xl h-10 w-10 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-foreground">
                          Allergies (if any)
                        </Label>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {COMMON_ALLERGIES.map((allergy) => (
                              <Badge
                                key={allergy}
                                variant={formData.allergies.includes(allergy) ? "default" : "outline"}
                                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs transition-all duration-200 hover:scale-105 ${
                                  formData.allergies.includes(allergy)
                                    ? "bg-destructive text-destructive-foreground shadow-sm"
                                    : "hover:bg-accent"
                                }`}
                                onClick={() => handleArrayToggle("allergies", allergy)}
                              >
                                {allergy}
                                {formData.allergies.includes(allergy) && (
                                  <Check className="w-3 h-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                            
                            {formData.allergies
                              .filter(allergy => !COMMON_ALLERGIES.includes(allergy))
                              .map((allergy) => (
                                <Badge
                                  key={allergy}
                                  className="cursor-pointer rounded-xl px-3 py-1.5 text-xs bg-destructive text-destructive-foreground shadow-sm hover:scale-105 transition-all duration-200"
                                  onClick={() => handleArrayToggle("allergies", allergy)}
                                >
                                  {allergy}
                                  <X className="w-3 h-3 ml-1" />
                                </Badge>
                              ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom allergy..."
                              value={customAllergy}
                              onChange={(e) => setCustomAllergy(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addCustomAllergy()}
                              className="rounded-xl h-10 border-border bg-background"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addCustomAllergy}
                              className="rounded-xl h-10 w-10 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operations" className="text-sm font-medium text-foreground">
                          Previous Operations (if any)
                        </Label>
                        <Textarea
                          id="operations"
                          placeholder="List any previous surgeries or operations..."
                          value={formData.previousOperations}
                          onChange={(e) => handleInputChange("previousOperations", e.target.value)}
                          className="rounded-2xl min-h-[80px] border-border bg-background/50 focus:bg-background transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="familial" className="text-sm font-medium text-foreground">
                          Familial Health Issues
                        </Label>
                        <Textarea
                          id="familial"
                          placeholder="Any family history of medical conditions..."
                          value={formData.familialHealthIssues}
                          onChange={(e) => handleInputChange("familialHealthIssues", e.target.value)}
                          className="rounded-2xl min-h-[80px] border-border bg-background/50 focus:bg-background transition-all duration-200"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-4">
                        <div className="relative inline-block">
                          <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage src={formData.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                              {formData.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                          >
                            <Upload className="w-4 h-4 text-primary-foreground" />
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{formData.name}</h3>
                          <p className="text-muted-foreground">
                            {formData.age} years old • {formData.gender}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Blood Group:</span>
                            <p className="font-medium text-foreground">{formData.bloodGroup}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date of Birth:</span>
                            <p className="font-medium text-foreground">{new Date(formData.dateOfBirth).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {formData.chronicDiseases.length > 0 && (
                          <div>
                            <span className="text-muted-foreground text-sm">Chronic Diseases:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.chronicDiseases.map((disease) => (
                                <Badge key={disease} variant="secondary" className="text-xs rounded-lg">
                                  {disease}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.allergies.length > 0 && (
                          <div>
                            <span className="text-muted-foreground text-sm">Allergies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.allergies.map((allergy) => (
                                <Badge key={allergy} variant="destructive" className="text-xs rounded-lg">
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.previousOperations && (
                          <div>
                            <span className="text-muted-foreground text-sm">Previous Operations:</span>
                            <p className="text-sm mt-1 bg-muted/50 p-2 rounded-lg text-foreground">{formData.previousOperations}</p>
                          </div>
                        )}

                        {formData.familialHealthIssues && (
                          <div>
                            <span className="text-muted-foreground text-sm">Familial Health Issues:</span>
                            <p className="text-sm mt-1 bg-muted/50 p-2 rounded-lg text-foreground">{formData.familialHealthIssues}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="rounded-2xl px-6 transition-all duration-200"
                  >
                    Back
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      onClick={handleNext}
                      disabled={(currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2)}
                      className="rounded-2xl px-6 transition-all duration-200"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleComplete} 
                      disabled={isLoading} 
                      className="rounded-2xl px-6 transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Setting up...</span>
                        </div>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}