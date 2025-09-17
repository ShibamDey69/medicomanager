"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/hooks/use-auth";
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
  Bell,
  AlertTriangle,
  X,
  Plus,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock data
const mockRecentPrescriptions: any[] = [
  {
    id: "1",
    doctor: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    date: "2024-01-15",
    medicines: ["Lisinopril 10mg", "Metformin 500mg"],
    status: "active",
  },
  {
    id: "2",
    doctor: "Dr. Michael Chen",
    specialty: "General Practitioner",
    date: "2024-01-10",
    medicines: ["Amoxicillin 250mg", "Ibuprofen 400mg"],
    status: "completed",
  },
  {
    id: "3",
    doctor: "Dr. Emily Davis",
    specialty: "Endocrinologist",
    date: "2024-01-08",
    medicines: ["Atorvastatin 20mg"],
    status: "active",
  },
];

const mockActivePrescriptions: any[] = [
  {
    id: "1",
    medicine: "Lisinopril 10mg",
    dosage: "Once daily",
    remaining: 25,
    nextDose: "8:00 AM",
    adherence: 95,
  },
  {
    id: "3",
    medicine: "Atorvastatin 20mg",
    dosage: "Once daily at bedtime",
    remaining: 18,
    nextDose: "10:00 PM",
    adherence: 88,
  },
];

const mockNotifications: any[] = [
  {
    id: "1",
    title: "Medication Reminder",
    message: "Time to take your Lisinopril",
    time: "2 hours ago",
    read: false,
    type: "reminder",
  },
  {
    id: "2",
    title: "Prescription Expiring",
    message: "Your Atorvastatin prescription expires in 3 days",
    time: "1 day ago",
    read: false,
    type: "warning",
  },
  {
    id: "3",
    title: "Lab Results Available",
    message: "Your recent blood work results are ready",
    time: "2 days ago",
    read: true,
    type: "info",
  },
];

const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50);
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    triggerHaptic();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

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
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-primary-foreground font-bold text-lg"
                  >
                    M
                  </motion.span>
                </div>
                {/* Animated ring around logo */}
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
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
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"
                  />
                  <p className="text-sm text-muted-foreground font-medium">
                    Welcome,{" "}
                    <span className="text-primary font-semibold">
                      {profile?.name || "User"}
                    </span>
                    ! 👋
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
              {/* Notifications */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300"
                >
                  <Bell className="h-4 w-4 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Theme Toggle with enhanced styling */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeToggle className="rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all duration-300" />
              </motion.div>

              {/* Logout Button with enhanced styling and confirmation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    triggerHaptic();
                    setShowLogoutModal(true);
                  }}
                  className="rounded-2xl bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 border border-red-200/50 dark:border-red-800/30 transition-all duration-300 group"
                >
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
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
              <h2 className="text-xl font-bold text-foreground">
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Button
                onClick={() => {
                  triggerHaptic();
                  router.push("/upload");
                }}
                className="h-20 md:h-24 rounded-3xl bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 hover:border-primary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <Upload className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">
                  Upload Rx
                </span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic();
                  router.push("/prescriptions");
                }}
                className="h-20 md:h-24 rounded-3xl bg-secondary/50 hover:bg-secondary text-secondary-foreground border-2 border-secondary/20 hover:border-secondary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">View All</span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic();
                  router.push("/chat");
                }}
                className="h-20 md:h-24 rounded-3xl bg-secondary/50 hover:bg-secondary text-secondary-foreground border-2 border-secondary/20 hover:border-secondary/30 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                variant="ghost"
              >
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-medium">AI Chat</span>
              </Button>

              <Button
                onClick={() => {
                  triggerHaptic();
                  router.push("/profile");
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
                  {mockActivePrescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Pill className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">
                        No Active Medications
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You don't have any active prescriptions at the moment.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          triggerHaptic();
                          router.push("/prescriptions");
                        }}
                        className="rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Prescription
                      </Button>
                    </div>
                  ) : (
                    mockActivePrescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors duration-300"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {prescription.medicine}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {prescription.dosage}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              Next dose: {prescription.nextDose}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="secondary" className="rounded-xl">
                            {prescription.remaining} left
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
                        triggerHaptic();
                        router.push("/prescriptions");
                      }}
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl flex items-center transition-all duration-300"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockRecentPrescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">
                        No Recent Prescriptions
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your recent prescription history will appear here once
                        you visit a doctor.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            triggerHaptic();
                            router.push("/prescriptions/upload");
                          }}
                          className="rounded-xl"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload Prescription
                        </Button>
                      </div>
                    </div>
                  ) : (
                    mockRecentPrescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors duration-300"
                        onClick={() => {
                          triggerHaptic();
                          router.push(`/prescriptions/${prescription.id}`);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">
                              {prescription.doctor}
                            </h4>
                            <Badge
                              variant={
                                prescription.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="rounded-xl text-xs"
                            >
                              {prescription.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {prescription.specialty}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(prescription.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {prescription.medicines.join(", ")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="rounded-3xl border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-foreground">
                    <div className="flex items-center">
                      <div className="relative">
                        <Clock className="w-5 h-5 mr-2 text-primary" />
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                        )}
                      </div>
                      Notifications
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 rounded-full text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl transition-all duration-300"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Mark All Read
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-medium text-foreground mb-2">
                        No Notifications
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You're all caught up! Notifications about appointments,
                        medications, and health updates will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-2xl transition-colors duration-300 cursor-pointer ${
                          notification.read
                            ? "bg-muted/20 hover:bg-muted/30"
                            : "bg-primary/10 border border-primary/20 hover:bg-primary/15"
                        }`}
                        onClick={() => {
                          triggerHaptic();
                          // Handle notification click - mark as read and navigate if needed
                          if (!notification.read) {
                            // Mark as read logic here
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4
                              className={`font-medium ${
                                notification.read
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          )}
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
                    <h3 className="text-lg font-semibold text-foreground">
                      Confirm Logout
                    </h3>
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
                    Are you sure you want to logout? You'll need to sign in
                    again to access your medical records and prescriptions.
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
  );
}
