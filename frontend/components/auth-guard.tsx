"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, User, Lock } from "lucide-react"

interface AuthState {
  phone: string
  authenticated: boolean
  timestamp: number
}

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem("medico_auth")
        if (!authData) {
          setIsAuthenticated(false)
          console.log("Auth data not found")
          return
        }

        const auth: AuthState = JSON.parse(authData)

        // Check if auth is still valid (24 hours)
        const isValid = auth.authenticated && Date.now() - auth.timestamp < 24 * 60 * 60 * 1000

        if (!isValid) {
          localStorage.removeItem("medico_auth")
          console.log("Auth data not valid")
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("medico_auth")
        setIsAuthenticated(false)
        console.log("Auth check failed")
      }
    }

    // Simulate loading progress for better UX
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    // Delay auth check slightly for smooth loading animation
    const authTimeout = setTimeout(() => {
      checkAuth()
      setLoadingProgress(100)
    }, 800)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(authTimeout)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated === false) {
      setTimeout(() => {
        router.push(redirectTo)
      }, 500)
    }
  }, [isAuthenticated, router, redirectTo])

  // Beautiful loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-primary rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent rounded-full blur-3xl"
          />
        </div>

        {/* Main loading content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center space-y-8 max-w-md mx-auto px-6"
        >
          {/* Logo/Brand section */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border-2 border-primary/20 rounded-3xl"
            />
          </motion.div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              MedicoManager
            </h1>
            <p className="text-muted-foreground text-sm">Securing your health data</p>
          </motion.div>

          {/* Loading animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center space-y-4 w-full"
          >
            {/* Animated shield */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <Shield className="w-8 h-8 text-primary" />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-md"
              />
            </motion.div>

            {/* Progress bar */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Verifying credentials</span>
                <span>{loadingProgress}%</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full relative"
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                </motion.div>
              </div>
            </div>

            {/* Loading text */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center space-x-2 text-sm text-muted-foreground"
            >
              <Lock className="w-4 h-4" />
              <span>Checking authentication...</span>
            </motion.div>
          </motion.div>

          {/* Security badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center space-x-4 text-xs text-muted-foreground"
          >
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Protected</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Beautiful unauthorized state with smooth transition
  if (!isAuthenticated) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="text-center space-y-4 max-w-md mx-auto px-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto"
            >
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                Access Denied
              </h2>
              <p className="text-red-600 dark:text-red-300 text-sm">
                Redirecting to login...
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Smooth entrance for authenticated content
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}