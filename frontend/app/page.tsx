"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Shield,
  Activity,
  Stethoscope,
  Plus,
  FileText,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Heart, text: "Health Records", color: "text-red-500" },
    { icon: Shield, text: "Secure Data", color: "text-blue-500" },
    { icon: Activity, text: "Health Monitoring", color: "text-green-500" },
    { icon: Stethoscope, text: "Medical Care", color: "text-purple-500" },
  ];

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Feature rotation
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 800);

    // Navigation timer
    const timer = setTimeout(() => {
      router.push("/landing");
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(featureInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating medical icons */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 text-primary/20"
        >
          <Plus className="w-12 h-12" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -15, 15, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-32 right-32 text-accent/20"
        >
          <FileText className="w-16 h-16" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, -25, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-32 left-16 text-primary/15"
        >
          <Heart className="w-10 h-10" />
        </motion.div>

        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "backOut" }}
        className="relative z-10 text-center max-w-lg mx-auto px-6"
      >
        {/* Logo section with enhanced animations */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          {/* Animated logo container */}
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto mb-6 w-28 h-28"
          >
            {/* Main logo */}
            <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/25">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotateY: [0, 180, 360],
                }}
                transition={{
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
                }}
              >
                <Stethoscope className="w-14 h-14 text-primary-foreground" />
              </motion.div>
            </div>

            {/* Orbiting elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -top-2 left-1/2 w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/50 transform -translate-x-1/2" />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-1/2 -right-2 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 transform -translate-y-1/2" />
            </motion.div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -bottom-2 left-1/4 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50" />
            </motion.div>

            {/* Pulsing ring */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute -inset-4 border-2 border-primary/30 rounded-full"
            />
          </motion.div>

          {/* Brand text with enhanced typography */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-3"
          >
            <motion.h1
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-300% bg-clip-text text-transparent"
              style={{ backgroundSize: "300% 100%" }}
            >
              MedicoManager
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-muted-foreground text-xl font-medium"
            >
              Smarter, Safer Medical Management
            </motion.p>

            {/* Rotating features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="h-8 flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center space-x-2"
                >
                  {React.createElement(features[currentFeature].icon, {
                    className: `w-5 h-5 ${features[currentFeature].color}`,
                  })}
                  <span className="text-sm font-medium text-muted-foreground">
                    {features[currentFeature].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Enhanced loading section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="space-y-6"
        >
          {/* Loading text */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-muted-foreground font-medium"
          >
            Initializing your health dashboard...
          </motion.p>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Loading</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent relative rounded-full"
              >
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </div>

          {/* Loading animation */}
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 bg-primary rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
              className="w-2 h-2 bg-accent rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-12 text-xs text-muted-foreground/70 font-medium"
        >
          Powered by advanced healthcare technology
        </motion.div>
      </motion.div>
    </div>
  );
}
