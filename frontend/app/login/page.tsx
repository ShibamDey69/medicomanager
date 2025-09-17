"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Phone, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const triggerHaptic = () => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(50);
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (typeof window !== 'undefined' && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Failed to initialize verification. Please refresh the page.');
      }
    }

    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error);
        }
      }
    };
  }, [recaptchaVerifier]);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle Indian phone numbers
    if (digits.length === 10) {
      return `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    } else if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    
    // If already formatted correctly
    if (phone.startsWith('+91') && phone.length === 13) {
      return phone;
    }
    
    // Default fallback
    return `+91${digits.slice(-10)}`;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && /^[6-9]/.test(digits); // Indian mobile numbers start with 6,7,8,9
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    triggerHaptic();

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!recaptchaVerifier) {
      setError("Verification system not ready. Please refresh the page.");
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
      setError("");
      console.log('OTP sent successfully');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'Invalid phone number format. Please check and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again after some time.';
          break;
        case 'auth/quota-exceeded':
          errorMessage = 'SMS quota exceeded. Please try again tomorrow.';
          break;
        case 'auth/app-not-authorized':
          errorMessage = 'App not authorized for phone authentication.';
          break;
        case 'auth/captcha-check-failed':
          errorMessage = 'Captcha verification failed. Please try again.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Recreate reCAPTCHA verifier on error
      try {
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
        }
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
        setRecaptchaVerifier(newVerifier);
      } catch (recaptchaError) {
        console.error('Error recreating reCAPTCHA:', recaptchaError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    triggerHaptic();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    if (!confirmationResult) {
      setError("No confirmation result found. Please try sending the code again.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otpString);
      const user: User = result.user;
      
      const idToken = await user.getIdToken();
      // Optional: Verify token with your backend
      // Uncomment and modify this section when you have your backend ready
      /*
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          uid: user.uid,
          phoneNumber: user.phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend verification failed');
      }
      */
      localStorage.setItem("medico_auth", JSON.stringify({
        phone: user.phoneNumber,
        authenticated: true,
        timestamp: Date.now()
      }));
      // For now, we'll proceed without backend verification
      console.log(idToken);
      router.push("/profile-setup");
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'Invalid verification code. Please check and try again.';
          break;
        case 'auth/code-expired':
          errorMessage = 'Verification code has expired. Please request a new one.';
          setStep('phone'); // Go back to phone step
          break;
        case 'auth/session-expired':
          errorMessage = 'Session expired. Please start over.';
          setStep('phone');
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Clear OTP inputs on error
      if (error.code !== 'auth/code-expired' && error.code !== 'auth/session-expired') {
        setOtp(["", "", "", "", "", ""]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhoneNumber(value);
      setError("");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!recaptchaVerifier) {
      setError("Verification system not ready. Please refresh the page.");
      return;
    }
    
    triggerHaptic();
    setError("");
    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtp(["", "", "", "", "", ""]);
      console.log('OTP resent successfully');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackButton = () => {
    triggerHaptic();
    if (step === "otp") {
      setStep("phone");
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } else {
      router.push("/landing");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
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
            onClick={handleBackButton}
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
                    <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
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
                    Authentication
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

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
              {step === "phone" ? (
                <Phone className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === "phone" ? "Welcome Back" : "Verify Your Phone"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === "phone"
                ? "Enter your phone number to continue"
                : `We sent a verification code to +91${phoneNumber}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.form
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handlePhoneSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-foreground"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className="text-lg py-6 pl-12 rounded-2xl border-2 focus:border-primary"
                        maxLength={10}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm bg-destructive/10 p-3 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-6 text-lg rounded-2xl"
                    disabled={isLoading || !validatePhoneNumber(phoneNumber)}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Sending Code...</span>
                      </div>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleOtpSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Verification Code
                    </label>
                    <div className="flex justify-center space-x-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(
                              index,
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 text-center text-lg font-semibold rounded-xl border-2 focus:border-primary"
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-destructive text-sm bg-destructive/10 p-3 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-6 text-lg rounded-2xl"
                    disabled={isLoading || otp.join("").length !== 6}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Didn't receive a code? Resend
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}