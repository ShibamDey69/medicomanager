"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { Upload, Shield, Stethoscope, Brain, Heart, Activity, Plus, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function LandingPage() {
  const router = useRouter()
  const [currentFeature, setCurrentFeature] = useState(0)

  const headerFeatures = [
    { icon: Heart, text: "Health Records", color: "text-red-500" },
    { icon: Shield, text: "Secure Data", color: "text-blue-500" },
    { icon: Activity, text: "Health Monitoring", color: "text-green-500" },
    { icon: Stethoscope, text: "Medical Care", color: "text-purple-500" },
  ]

  const features = [
    {
      icon: Upload,
      title: "Upload Prescriptions",
      description: "Easily upload and digitize your prescriptions with AI-powered extraction and smart organization",
    },
    {
      icon: Brain,
      title: "AI Medicine Guide",
      description: "Get intelligent insights about your medications, interactions, and side effects with personalized recommendations",
    },
    {
      icon: Shield,
      title: "Secure Dashboard",
      description: "Your medical data is protected with enterprise-grade security and end-to-end encryption",
    }
  ]

  useEffect(() => {
    // Feature rotation for header
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % headerFeatures.length);
    }, 2000);

    return () => {
      clearInterval(featureInterval);
    };
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating medical icons */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 15, -15, 0],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 text-primary/10"
        >
          <Plus className="w-16 h-16" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -20, 20, 0],
            opacity: [0.05, 0.12, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-40 right-32 text-primary/8"
        >
          <FileText className="w-20 h-20" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
            opacity: [0.03, 0.1, 0.03],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute bottom-32 left-16 text-primary/10"
        >
          <Heart className="w-14 h-14" />
        </motion.div>

        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.12, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-primary/5"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
                    <Stethoscope className="w-6 h-6 text-primary-foreground" />
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
              
              {/* Rotating features in header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="h-4 flex items-center"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center space-x-1"
                  >
                    {React.createElement(headerFeatures[currentFeature].icon, {
                      className: `w-3 h-3 ${headerFeatures[currentFeature].color}`,
                    })}
                    <span className="text-xs font-medium text-muted-foreground">
                      {headerFeatures[currentFeature].text}
                    </span>
                  </motion.div>
                </AnimatePresence>
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

      {/* Hero Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <motion.h1
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-300% bg-clip-text text-transparent leading-tight"
              style={{ backgroundSize: "300% 100%" }}
            >
              Smarter, Safer Medical Management
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed"
            >
              Take control of your health with AI-powered prescription tracking, intelligent reminders, and personalized
              medical insights designed for modern healthcare.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="pt-4"
            >
              <Button
                size="lg"
                className="text-lg px-10 py-7 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transform hover:scale-105"
                onClick={() => router.push("/login")}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    →
                  </motion.div>
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-muted/20 relative">
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything you need to manage your health
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to simplify your healthcare journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card/80 backdrop-blur-sm h-full group">
                  <CardContent className="p-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300"
                    >
                      <feature.icon className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}