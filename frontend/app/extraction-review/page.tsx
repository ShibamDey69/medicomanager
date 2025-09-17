"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, FileText, Pill, Edit3, Plus, X, Check } from "lucide-react"
import { motion } from "framer-motion"

interface Medicine {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  status: "active" | "completed" | "paused" | "discontinued"
}

interface ExtractedData {
  doctor: string
  date: string
  medicines: Medicine[]
}

const mockExtractedData: ExtractedData = {
  doctor: "Dr. Sarah Johnson, MD",
  date: "2024-01-15",
  medicines: [
    {
      id: "1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "Take with food in the morning",
      status: "active",
    },
    {
      id: "2",
      name: "Metoprolol",
      dosage: "50mg",
      frequency: "Twice daily",
      duration: "30 days",
      instructions: "Take with or without food",
      status: "active",
    },
  ],
}

export default function ExtractionReviewPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData>(mockExtractedData)
  const [editingMedicine, setEditingMedicine] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fileData = localStorage.getItem("medico_uploaded_prescription")
    if (fileData) {
      setUploadedFile(JSON.parse(fileData))
    } else {
      router.push("/upload")
    }
  }, [router])

  const handleMedicineChange = (medicineId: string, field: string, value: string) => {
    setExtractedData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((med) => (med.id === medicineId ? { ...med, [field]: value } : med)),
    }))
  }

  const addNewMedicine = () => {
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      status: "active",
    }
    setExtractedData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine],
    }))
    setEditingMedicine(newMedicine.id)
  }

  const removeMedicine = (medicineId: string) => {
    setExtractedData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((med) => med.id !== medicineId),
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)

    // Mock save operation
    setTimeout(() => {
      // Save to localStorage (mock database)
      const prescriptions = JSON.parse(localStorage.getItem("medico_prescriptions") || "[]")
      const hasActiveMedicine = extractedData.medicines.some((med) => med.status === "active")
      const prescriptionStatus = hasActiveMedicine ? "active" : "completed"
      const newPrescription = {
        id: Date.now().toString(),
        ...extractedData,
        uploadedFile: uploadedFile,
        createdAt: new Date().toISOString(),
        status: prescriptionStatus,
      }

      prescriptions.push(newPrescription)
      localStorage.setItem("medico_prescriptions", JSON.stringify(prescriptions))

      // Clean up uploaded file data
      localStorage.removeItem("medico_uploaded_prescription")

      setIsLoading(false)
      router.push("/prescriptions")
    }, 1500)
  }

  if (!uploadedFile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        {/* Enhanced Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="border-b border-border/20 bg-gradient-to-r from-card/90 via-card/70 to-card/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {/* Back Button - Clean and minimal */}
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
                onClick={() => router.push("/upload")}
                className="rounded-2xl hover:bg-muted/50 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </motion.div>

            {/* Center Title Section - Clean and focused */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center space-x-2"
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
                  className="relative w-6 h-6"
                >
                  {/* Main logo */}
                  <div className="w-full h-full bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-primary/40 transition-all duration-300">
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
                      <FileText className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  </div>

                  {/* Orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-0.5 left-1/2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-md shadow-green-500/50 transform -translate-x-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-0.5 w-1 h-1 bg-blue-500 rounded-full shadow-md shadow-blue-500/50 transform -translate-y-1/2" />
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
                    className="absolute -inset-1 border border-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.div>
              </motion.div>

              {/* Title */}
              <span className="font-semibold text-foreground">Review Extraction</span>
            </motion.div>

            {/* Right Actions - Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Theme Toggle - Clean styling */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeToggle className="rounded-2xl" />
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uploaded Document */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Uploaded Document</CardTitle>
                <CardDescription>Original prescription file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-muted/30 rounded-2xl overflow-hidden">
                  <img
                    src={uploadedFile.previewUrl || "/placeholder.svg"}
                    alt="Uploaded prescription"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>File: {uploadedFile.name}</p>
                  <p>Uploaded: {new Date(uploadedFile.uploadDate).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Data */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Extracted Data</CardTitle>
                    <CardDescription>Review and edit the extracted information</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addNewMedicine} className="rounded-xl bg-transparent">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medicine
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Doctor & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Input
                      value={extractedData.doctor}
                      onChange={(e) => setExtractedData((prev) => ({ ...prev, doctor: e.target.value }))}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={extractedData.date}
                      onChange={(e) => setExtractedData((prev) => ({ ...prev, date: e.target.value }))}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                {/* Medicines */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Medications</h3>
                  </div>

                  {extractedData.medicines.map((medicine, index) => (
                    <motion.div
                      key={medicine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-muted/30 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">Medicine {index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingMedicine(editingMedicine === medicine.id ? null : medicine.id)}
                            className="h-8 w-8 rounded-xl"
                          >
                            {editingMedicine === medicine.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Edit3 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMedicine(medicine.id)}
                            className="h-8 w-8 rounded-xl text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Medicine Name</Label>
                          <Input
                            value={medicine.name}
                            onChange={(e) => handleMedicineChange(medicine.id, "name", e.target.value)}
                            placeholder="e.g., Lisinopril"
                            className="rounded-xl text-sm"
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosage</Label>
                          <Input
                            value={medicine.dosage}
                            onChange={(e) => handleMedicineChange(medicine.id, "dosage", e.target.value)}
                            placeholder="e.g., 10mg"
                            className="rounded-xl text-sm"
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency</Label>
                          <Select
                            value={medicine.frequency}
                            onValueChange={(value) => handleMedicineChange(medicine.id, "frequency", value)}
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          >
                            <SelectTrigger className="rounded-xl text-sm">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Three times daily">Three times daily</SelectItem>
                              <SelectItem value="Four times daily">Four times daily</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <Input
                            value={medicine.duration}
                            onChange={(e) => handleMedicineChange(medicine.id, "duration", e.target.value)}
                            placeholder="e.g., 30 days"
                            className="rounded-xl text-sm"
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Instructions</Label>
                          <Input
                            value={medicine.instructions}
                            onChange={(e) => handleMedicineChange(medicine.id, "instructions", e.target.value)}
                            placeholder="e.g., Take with food"
                            className="rounded-xl text-sm"
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={medicine.status}
                            onValueChange={(value) => handleMedicineChange(medicine.id, "status", value)}
                            disabled={editingMedicine !== medicine.id && editingMedicine !== null}
                          >
                            <SelectTrigger className="rounded-xl text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || extractedData.medicines.some((m) => !m.name || !m.dosage)}
                    className="w-full py-6 text-lg rounded-2xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Saving Prescription...</span>
                      </div>
                    ) : (
                      "Confirm & Save Prescription"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
