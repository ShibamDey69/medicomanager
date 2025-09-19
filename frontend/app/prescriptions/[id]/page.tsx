"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import {
  ArrowLeft,
  User,
  Calendar,
  Pill,
  Edit3,
  Save,
  X,
  Trash2,
  Clock,
  FileText,
  PlayCircle,
  PauseCircle,
  StopCircle,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: string;
  status: "active" | "completed" | "paused" | "discontinued";
}

interface Prescription {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  medicines: Medicine[];
  status: "active" | "completed" | "expired";
  userId: string;
  createdAt: string;
}

export default function PrescriptionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrescription, setEditedPrescription] =
    useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get user ID from localStorage
  const getUserId = (): string | null => {
    if (typeof window === "undefined") return null;
    const authData = localStorage.getItem("medico_auth");
    if (!authData) return null;
    try {
      const parsed = JSON.parse(authData);
      return parsed.userId || null;
    } catch {
      return null;
    }
  };

  // Fetch prescription from backend
  const fetchPrescription = async () => {
    const prescriptionId = params?.id as string;
    if (!prescriptionId) {
      router.push("/prescriptions");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/prescriptions/${prescriptionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prescription: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data) {
        // Transform data to match our UI expectations
        const transformedData: Prescription = {
          id: data.data.id,
          doctor: data.data.doctor || "Unknown Doctor",
          specialty: data.data.specialty || "General",
          date: data.data.date || new Date().toISOString(),
          medicines:
            data.data.medicines && Array.isArray(data.data.medicines)
              ? data.data.medicines.map((med: any) => ({
                  id: med.id,
                  name: med.name || "Unknown Medicine",
                  dosage: med.dosage || "",
                  frequency: med.frequency || "as directed",
                  duration: med.duration || "",
                  instruction: med.instruction || "",
                  status: med.status || "active",
                }))
              : [],
          status: data.data.status || "active",
          userId: data.data.userId || "",
          createdAt: data.data.createdAt || new Date().toISOString(),
        };

        setPrescription(transformedData);
        setEditedPrescription({ ...transformedData });
      }
    } catch (err: any) {
      console.error("Error fetching prescription:", err);
      setError(err.message || "Failed to load prescription");
    } finally {
      setIsLoading(false);
    }
  };

  // Update prescription in backend
  const updatePrescription = async () => {
    if (!editedPrescription) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if any medicine is active to determine prescription status
      const hasActiveMedicine = editedPrescription.medicines.some(
        (med) => med.status === "active"
      );
      const updatedPrescriptionData = {
        ...editedPrescription,
        status: hasActiveMedicine ? "active" : "completed",
      };

      const response = await fetch(
        `${API_BASE_URL}/prescriptions/${editedPrescription.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updatedPrescriptionData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update prescription: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data) {
        // Transform response data
        const transformedData: Prescription = {
          id: data.data.id,
          doctor: data.data.doctor || "Unknown Doctor",
          specialty: data.data.specialty || "General",
          date: data.data.date || new Date().toISOString(),
          medicines:
            data.data.medicines && Array.isArray(data.data.medicines)
              ? data.data.medicines.map((med: any) => ({
                  id: med.id,
                  name: med.name || "Unknown Medicine",
                  dosage: med.dosage || "",
                  frequency: med.frequency || "as directed",
                  duration: med.duration || "",
                  instruction: med.instruction || "",
                  status: med.status || "active",
                }))
              : [],
          status: data.data.status || "active",
          userId: data.data.userId || "",
          createdAt: data.data.createdAt || new Date().toISOString(),
        };

        setPrescription(transformedData);
        setEditedPrescription({ ...transformedData });
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("Error updating prescription:", err);
      setError(err.message || "Failed to update prescription");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete prescription from backend
  const deletePrescription = async () => {
    if (!prescription) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/prescriptions/${prescription.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete prescription: ${response.status}`);
      }

      // Redirect to prescriptions list after successful deletion
      router.push("/prescriptions");
    } catch (err: any) {
      console.error("Error deleting prescription:", err);
      setError(err.message || "Failed to delete prescription");
      setIsLoading(false);
    }
  };

  // Load prescription on component mount
  useEffect(() => {
    fetchPrescription();
  }, [params.id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (prescription) {
      setEditedPrescription({ ...prescription });
    }
  };

  const handleSave = async () => {
    if (!editedPrescription) return;
    await updatePrescription();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await deletePrescription();
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!editedPrescription) return;
    setEditedPrescription((prev) =>
      prev ? { ...prev, [field]: value } : null
    );
  };

  const handleMedicineChange = (
    index: number,
    field: string,
    value: string
  ) => {
    if (!editedPrescription) return;
    setEditedPrescription((prev) => {
      if (!prev) return null;
      const updatedMedicines = [...prev.medicines];
      updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
      return { ...prev, medicines: updatedMedicines };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "expired":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMedicineStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "discontinued":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMedicineStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <PlayCircle className="w-3 h-3" />;
      case "completed":
        return <FileText className="w-3 h-3" />;
      case "paused":
        return <PauseCircle className="w-3 h-3" />;
      case "discontinued":
        return <StopCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              Loading prescription
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch your details...
            </p>
          </div>
        </motion.div>
      </div>
    );
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
                setIsLoading(true);
                fetchPrescription();
              }}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!prescription || !editedPrescription) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Prescription Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              The prescription you're looking for doesn't exist or you don't
              have permission to view it.
            </p>
            <Button
              onClick={() => router.push("/prescriptions")}
              className="rounded-xl"
            >
              Back to Prescriptions
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
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
                    repeat: Number.POSITIVE_INFINITY,
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
                      <Pill className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  </div>
                  {/* Orbiting elements */}
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
                  {/* Pulsing ring on hover */}
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
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 shadow-2xl shadow-black/5 rounded-2xl sm:rounded-3xl bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-card/90 via-card/70 to-card/90 backdrop-blur-xl border-b border-border/20 p-4 sm:p-6">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10"
                      >
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </motion.div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                          {isEditing ? (
                            <Input
                              value={editedPrescription.doctor}
                              onChange={(e) =>
                                handleFieldChange("doctor", e.target.value)
                              }
                              className="text-xl sm:text-2xl font-bold border-2 border-dashed border-primary/30 bg-background/50 focus:border-primary focus:bg-background rounded-xl px-3 py-2 w-full"
                              placeholder="Doctor's name"
                            />
                          ) : (
                            <span className="text-foreground break-words">
                              {prescription.doctor}
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {isEditing ? (
                              <Input
                                type="date"
                                value={
                                  editedPrescription.date.split("T")[0] || ""
                                }
                                onChange={(e) =>
                                  handleFieldChange("date", e.target.value)
                                }
                                className="text-sm border-2 border-dashed border-primary/30 bg-background/50 focus:border-primary focus:bg-background rounded-lg px-2 py-1 w-full sm:w-36"
                              />
                            ) : (
                              <span className="font-medium text-sm sm:text-base">
                                {new Date(prescription.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            )}
                          </div>
                          <Badge
                            className={`text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border shadow-sm self-start ${getStatusColor(
                              prescription.status
                            )}`}
                          >
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span className="capitalize">
                                {prescription.status}
                              </span>
                            </div>
                          </Badge>
                        </div>
                        {prescription.specialty && (
                          <div className="text-sm text-muted-foreground">
                            Specialty: {prescription.specialty}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="rounded-lg sm:rounded-xl border-border/60 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-300 flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3 py-2"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Cancel</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isLoading}
                            className="rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3 py-2"
                          >
                            {isLoading ? (
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin sm:mr-2" />
                            ) : (
                              <Save className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            )}
                            <span className="hidden sm:inline">
                              Save Changes
                            </span>
                            <span className="sm:hidden">Save</span>
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="viewing"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                            className="rounded-lg sm:rounded-xl border-border/60 bg-card/50 hover:bg-card transition-all duration-300 flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3 py-2"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="rounded-lg sm:rounded-xl border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300 flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-3 py-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                {/* Medications Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      Medications
                    </h3>
                    <div className="h-px bg-gradient-to-r from-border to-transparent flex-1 ml-4" />
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium px-2 py-1 rounded-full"
                    >
                      {editedPrescription.medicines.length}{" "}
                      {editedPrescription.medicines.length === 1
                        ? "item"
                        : "items"}
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:gap-6">
                    {editedPrescription.medicines.map((medicine, index) => (
                      <motion.div
                        key={medicine.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-muted/40 via-muted/20 to-muted/10 rounded-2xl sm:rounded-3xl border border-border/30 hover:border-border/50 transition-all duration-300 shadow-lg shadow-black/5">
                          <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-sm sm:text-base">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground text-base sm:text-lg">
                                  {isEditing ? (
                                    <Input
                                      value={medicine.name}
                                      onChange={(e) =>
                                        handleMedicineChange(
                                          index,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      className="font-semibold border-2 border-dashed border-primary/30 bg-background/50 focus:border-primary focus:bg-background rounded-lg px-2 py-1 w-full text-sm sm:text-base"
                                      placeholder="Medicine name"
                                    />
                                  ) : (
                                    medicine.name
                                  )}
                                </h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Treatment details
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={`text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border shadow-sm self-start ${getMedicineStatusColor(
                                medicine.status || "active"
                              )}`}
                            >
                              <div className="flex items-center space-x-1">
                                {getMedicineStatusIcon(
                                  medicine.status || "active"
                                )}
                                <span className="capitalize">
                                  {medicine.status || "active"}
                                </span>
                              </div>
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="space-y-2 sm:space-y-3">
                              <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center space-x-2">
                                <span>Dosage</span>
                                {isEditing && (
                                  <span className="text-destructive">*</span>
                                )}
                              </Label>
                              {isEditing ? (
                                <Input
                                  value={medicine.dosage}
                                  onChange={(e) =>
                                    handleMedicineChange(
                                      index,
                                      "dosage",
                                      e.target.value
                                    )
                                  }
                                  className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 focus:bg-background transition-all duration-300 text-sm sm:text-base"
                                  placeholder="e.g., 10mg, 2 tablets"
                                />
                              ) : (
                                <div className="p-3 bg-background/60 rounded-lg sm:rounded-xl border border-border/30">
                                  <p className="text-foreground font-medium text-sm sm:text-base break-words">
                                    {medicine.dosage}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2 sm:space-y-3">
                                <Label className="text-xs sm:text-sm font-semibold text-foreground">
                                  Frequency
                                </Label>
                                {isEditing ? (
                                  <Select
                                    value={medicine.frequency}
                                    onValueChange={(value) =>
                                      handleMedicineChange(
                                        index,
                                        "frequency",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 hover:bg-background transition-all duration-300 text-sm sm:text-base">
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      <SelectItem value="Once daily">
                                        Once daily
                                      </SelectItem>
                                      <SelectItem value="Twice daily">
                                        Twice daily
                                      </SelectItem>
                                      <SelectItem value="Three times daily">
                                        Three times daily
                                      </SelectItem>
                                      <SelectItem value="Four times daily">
                                        Four times daily
                                      </SelectItem>
                                      <SelectItem value="As needed">
                                        As needed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="p-3 bg-background/60 rounded-lg sm:rounded-xl border border-border/30">
                                    <p className="text-foreground font-medium text-sm sm:text-base break-words">
                                      {medicine.frequency}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 sm:space-y-3">
                                <Label className="text-xs sm:text-sm font-semibold text-foreground">
                                  Duration
                                </Label>
                                {isEditing ? (
                                  <Input
                                    value={medicine.duration}
                                    onChange={(e) =>
                                      handleMedicineChange(
                                        index,
                                        "duration",
                                        e.target.value
                                      )
                                    }
                                    className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 focus:bg-background transition-all duration-300 text-sm sm:text-base"
                                    placeholder="e.g., 7 days, 2 weeks"
                                  />
                                ) : (
                                  <div className="p-3 bg-background/60 rounded-lg sm:rounded-xl border border-border/30">
                                    <p className="text-foreground font-medium text-sm sm:text-base break-words">
                                      {medicine.duration}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {isEditing && (
                                <div className="space-y-2 sm:space-y-3">
                                  <Label className="text-xs sm:text-sm font-semibold text-foreground">
                                    Status
                                  </Label>
                                  <Select
                                    value={medicine.status || "active"}
                                    onValueChange={(value) =>
                                      handleMedicineChange(
                                        index,
                                        "status",
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 hover:bg-background transition-all duration-300 text-sm sm:text-base">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      <SelectItem value="active">
                                        Active
                                      </SelectItem>
                                      <SelectItem value="completed">
                                        Completed
                                      </SelectItem>
                                      <SelectItem value="paused">
                                        Paused
                                      </SelectItem>
                                      <SelectItem value="discontinued">
                                        Discontinued
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <Label className="text-xs sm:text-sm font-semibold text-foreground">
                                Special Instructions
                              </Label>
                              {isEditing ? (
                                <Input
                                  value={medicine.instruction}
                                  onChange={(e) =>
                                    handleMedicineChange(
                                      index,
                                      "instruction",
                                      e.target.value
                                    )
                                  }
                                  className="rounded-lg sm:rounded-xl border-border/60 bg-background/80 focus:bg-background transition-all duration-300 text-sm sm:text-base"
                                  placeholder="e.g., Take with food, Avoid alcohol"
                                />
                              ) : (
                                <div className="p-3 bg-background/60 rounded-lg sm:rounded-xl border border-border/30">
                                  <p className="text-foreground font-medium text-sm sm:text-base break-words">
                                    {medicine.instruction ||
                                      "No special instructions"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                {/* Save/Cancel Actions - Only show when editing */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-end sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-border/20"
                    >
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="rounded-lg sm:rounded-xl border-border/60 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-300 px-4 sm:px-6 w-full sm:w-auto"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Changes
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 px-4 sm:px-6 w-full sm:w-auto"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save All Changes
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Metadata Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="pt-4 sm:pt-6 border-t border-border/20"
                >
                  <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3 sm:mb-4">
                      Prescription Information
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
                      <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0">
                        <span className="text-muted-foreground font-medium">
                          Created Date:
                        </span>
                        <span className="font-medium text-foreground">
                          {new Date(prescription.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0">
                        <span className="text-muted-foreground font-medium">
                          Prescription ID:
                        </span>
                        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-lg text-foreground break-all sm:break-normal">
                          {prescription.id}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:space-y-0">
                        <span className="text-muted-foreground font-medium">
                          User ID:
                        </span>
                        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-lg text-foreground break-all sm:break-normal">
                          {prescription.userId}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={cancelDelete}
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden">
                  <CardHeader className="text-center pb-4 bg-gradient-to-br from-destructive/5 to-destructive/10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.1,
                        type: "spring",
                        stiffness: 400,
                      }}
                      className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center"
                    >
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                    </motion.div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Delete Prescription
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      This action cannot be undone
                    </p>
                  </CardHeader>
                  <CardContent className="p-6 text-center space-y-6">
                    <div className="space-y-2">
                      <p className="text-foreground font-medium">
                        Are you sure you want to delete this prescription?
                      </p>
                      {prescription && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-foreground">
                            {" "}
                            {prescription.doctor}
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(prescription.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        All medication details and history will be permanently
                        removed.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={cancelDelete}
                        disabled={isLoading}
                        className="flex-1 rounded-xl border-border/60 hover:bg-muted/50 transition-all duration-300 bg-transparent"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={confirmDelete}
                        disabled={isLoading}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Prescription
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
