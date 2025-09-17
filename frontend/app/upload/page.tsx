"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthGuard } from "@/components/auth-guard"
import { ArrowLeft, Upload, Camera, FileText, X, CheckCircle, Pill } from "lucide-react"
import { motion } from "framer-motion"

export default function UploadPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = useCallback((file: File) => {
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setUploadedFile(file)

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl("/pdf-document.png")
      }
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleCameraCapture = () => {
    // Mock camera capture - in real app would use camera API
    const mockImageFile = new File(["mock"], "camera-capture.jpg", { type: "image/jpeg" })
    setUploadedFile(mockImageFile)
    setPreviewUrl("/prescription-document-from-camera.jpg")
  }

  const handleExtract = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)

    // Mock processing delay
    setTimeout(() => {
      // Store the uploaded file data for the extraction review page
      const fileData = {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        previewUrl: previewUrl,
        uploadDate: new Date().toISOString(),
      }

      localStorage.setItem("medico_uploaded_prescription", JSON.stringify(fileData))
      setIsProcessing(false)
      router.push("/extraction-review")
    }, 2000)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl("")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
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
                onClick={() => router.push("/prescriptions")}
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
                      <Pill className="w-4 h-4 text-primary-foreground" />
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

              {/* Responsive Title */}
              <span className="font-semibold text-foreground hidden sm:inline">
                Prescription Details
              </span>
              <span className="font-semibold text-foreground sm:hidden text-sm">
                Details
              </span>
            </motion.div>

            {/* Right Actions - Minimal set */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center space-x-2"
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

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {!uploadedFile ? (
            <Card className="border-0 shadow-xl rounded-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Upload Your Prescription</CardTitle>
                <CardDescription className="text-base">
                  Upload a photo or PDF of your prescription to extract medication details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drag & Drop Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-primary/50 ${
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-2">Drag and drop your prescription here</p>
                      <p className="text-muted-foreground">Supports JPG, PNG, and PDF files up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,.pdf"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="lg" className="w-full py-6 rounded-2xl bg-transparent" asChild>
                        <div className="flex items-center space-x-2 cursor-pointer">
                          <FileText className="w-5 h-5" />
                          <span>Choose File</span>
                        </div>
                      </Button>
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCameraCapture}
                    className="py-6 rounded-2xl bg-transparent"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                </div>

                {/* Tips */}
                <div className="bg-muted/30 p-4 rounded-2xl">
                  <h3 className="font-medium text-foreground mb-2">Tips for better results:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure the prescription is well-lit and clearly visible</li>
                    <li>• Avoid shadows and reflections</li>
                    <li>• Include the entire prescription in the frame</li>
                    <li>• Make sure text is not blurry or cut off</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Preview</CardTitle>
                      <CardDescription>Review your uploaded prescription</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="rounded-2xl text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* File Preview */}
                    <div className="space-y-4">
                      <div className="aspect-[3/4] bg-muted/30 rounded-2xl overflow-hidden">
                        {previewUrl && (
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Prescription preview"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>

                    {/* File Details */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">File uploaded successfully</p>
                            <p className="text-sm text-muted-foreground">Ready for processing</p>
                          </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File name:</span>
                            <span className="font-medium text-foreground">{uploadedFile.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File size:</span>
                            <span className="font-medium text-foreground">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File type:</span>
                            <span className="font-medium text-foreground">{uploadedFile.type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={handleExtract}
                          disabled={isProcessing}
                          className="w-full py-6 text-lg rounded-2xl"
                        >
                          {isProcessing ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              <span>Extracting Data...</span>
                            </div>
                          ) : (
                            "Extract Prescription Data"
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={removeFile}
                          className="w-full py-3 rounded-2xl bg-transparent"
                        >
                          Upload Different File
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Info */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 p-4 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="font-medium text-foreground">Processing your prescription...</p>
                      <p className="text-sm text-muted-foreground">
                        Our AI is extracting medication details from your document
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
