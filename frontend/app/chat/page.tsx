"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGuard } from "@/components/auth-guard";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AuthData {
  phone: string;
  authenticated: boolean;
  timestamp: number;
  userId: string;
  hasProfile: boolean;
}

const quickQuestions = [
  "What are the side effects of my blood pressure medication?",
  "Can I take ibuprofen with my current medications?",
  "What should I do if I miss a dose?",
  "Are there any food interactions I should know about?",
  "How long does it take for my medication to work?",
  "What are the signs of an allergic reaction?",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      content: `**Welcome to AI Medical Assistant**

I'm here to provide evidence-based information about:

**Medication Information:**
• Drug mechanisms and indications
• Side effects and contraindications  
• Dosing guidelines and administration
• Drug interactions and safety profiles

**Clinical Topics:**
• Disease management basics
• Laboratory value interpretation
• General health and wellness guidance
• When to seek professional care

**Important Disclaimer:**
This service provides educational information only and does not constitute medical advice. Always consult qualified healthcare professionals for diagnosis, treatment, and personalized medical guidance.

How may I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0); // For debugging
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!jobId || !isTyping) return;

    console.log("Starting polling for jobId:", jobId);
    setPollingAttempts(0);

    const pollInterval = setInterval(async () => {
      setPollingAttempts((prev) => prev + 1);
      console.log(
        `Polling attempt #${pollingAttempts + 1} for jobId: ${jobId}`
      );

      try {
        const response = await fetch(`${API_BASE_URL}/ai/answer/${jobId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          // Don't throw error - continue polling
          console.log(`HTTP error ${response.status}, continuing to poll...`);
          return;
        }

        const {data} = await response.json();
        console.log("Received data:", data);

        if (
          data.status === "processing" ||
          data.status === "pending" ||
          data.status === "running"
        ) {
          console.log("Still processing, continuing to poll...");
          // Still processing, continue polling
          return;
        }

        // Check for completed/finished/success status
        if (
          data.status === "completed" ||
          data.status === "finished" ||
          data.status === "success"
        ) {
          console.log("Got final answer:", data);
          clearInterval(pollInterval);

          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: "ai",
            content:
              data.answer ||
              data.message ||
              data.result ||
              "I couldn't generate a response at this time. Please try again later.",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          setIsTyping(false);
          setJobId(null);
          setPollingAttempts(0);
          return;
        }

        // If we get here, it's some other status - treat as completed but with potential error message
        console.log(
          "Got unexpected status, treating as completed:",
          data.status
        );
        clearInterval(pollInterval);

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content:
            data.answer ||
            data.message ||
            data.result ||
            data.error ||
            "I couldn't generate a response at this time. Please try again later.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        setJobId(null);
        setPollingAttempts(0);
      } catch (error) {
        console.error(
          "Error fetching AI answer (will continue polling):",
          error
        );
        
      }
    }, 2000); // Poll every 2 seconds

    
    return () => {
      console.log("Cleaning up polling interval");
      clearInterval(pollInterval);
    };
  }, [jobId, isTyping, pollingAttempts]);
  const getUserIdFromLocalStorage = (): string | null => {
    try {
      const authDataStr = localStorage.getItem("medico_auth");
      if (!authDataStr) {
        return null;
      }

      const authData: AuthData = JSON.parse(authDataStr);

      // Verify the data has what we need
      if (authData && authData.userId && authData.authenticated) {
        return authData.userId;
      }

      return null;
    } catch (error) {
      console.error("Error getting user ID from localStorage:", error);
      return null;
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setShowQuickQuestions(false);

    try {
      // Get user ID from localStorage
      const userId = getUserIdFromLocalStorage();

      if (!userId) {
        throw new Error("User not authenticated. Please log in again.");
      }

      console.log("Sending question to backend:", message);
      console.log("User ID:", userId);

      // Send question to backend
      const askResponse = await fetch(`${API_BASE_URL}/ai/ask/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          question: message,
        }),
      });

      console.log("Ask response status:", askResponse.status);

      if (!askResponse.ok) {
        const errorText = await askResponse.text();
        console.error("Backend error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.message || `HTTP error! status: ${askResponse.status}`
          );
        } catch (e) {
          throw new Error(
            `HTTP error! status: ${askResponse.status} - ${errorText}`
          );
        }
      }

      const askData = await askResponse.json();
      console.log("Full ask response data:", askData);

      // Handle different possible response structures
      let extractedJobId = null;

      // Try different possible locations for jobId
      if (askData.jobId) {
        extractedJobId = askData.jobId;
      } else if (askData.data && askData.data.jobId) {
        extractedJobId = askData.data.jobId;
      } else if (askData.result && askData.result.jobId) {
        extractedJobId = askData.result.jobId;
      } else if (typeof askData === "string") {
        // Sometimes the jobId might be returned directly as a string
        extractedJobId = askData;
      }

      if (extractedJobId) {
        console.log("Extracted jobId:", extractedJobId);
        setJobId(extractedJobId);
        // The polling effect will handle getting the answer
      } else {
        throw new Error(
          "No jobId received from server. Response: " + JSON.stringify(askData)
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "ai",
        content:
          error instanceof Error
            ? `Sorry, I encountered an error: ${error.message}`
            : "Sorry, I'm having trouble connecting to the server. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex flex-col">
        {/* Enhanced Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="border-b border-border/20 bg-gradient-to-r from-card/95 via-card/80 to-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-primary/5"
        >
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Back Button */}
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
                onClick={() => router.push("/dashboard")}
                className="rounded-xl hover:bg-muted/50 transition-all duration-200 w-9 h-9 sm:w-10 sm:h-10"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </motion.div>

            {/* Center Title Section */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center space-x-2 sm:space-x-3"
            >
              {/* Enhanced animated logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
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
                  className="relative w-8 h-8 sm:w-9 sm:h-9"
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotateY: [0, 180, 360],
                      }}
                      transition={{
                        scale: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                        rotateY: {
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    >
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    </motion.div>
                  </div>

                  {/* Orbiting elements */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0"
                  >
                    <div className="absolute -top-1 left-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-sm transform -translate-x-1/2" />
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-1/2 -right-1 w-1 h-1 bg-blue-500 rounded-full shadow-sm transform -translate-y-1/2" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Title - Responsive */}
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-foreground">
                  <span className="hidden sm:inline">AI Medical Assistant</span>
                  <span className="sm:hidden">AI Assistant</span>
                </h1>
                <div className="hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3" />
                  <span>Professional medical guidance</span>
                </div>
              </div>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThemeToggle className="rounded-xl w-9 h-9 sm:w-10 sm:h-10" />
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              <div className="space-y-4 sm:space-y-6">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] ${
                          message.type === "user"
                            ? "flex-row-reverse space-x-reverse"
                            : ""
                        }`}
                      >
                        {/* Avatar */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                            message.type === "user"
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                              : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground border border-border"
                          }`}
                        >
                          {message.type === "user" ? (
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </motion.div>

                        {/* Message Bubble */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                          className={`rounded-2xl px-3 sm:px-4 py-3 sm:py-4 shadow-md hover:shadow-lg transition-all duration-200 ${
                            message.type === "user"
                              ? "bg-gradient-to-br from-primary to-primary/95 text-primary-foreground"
                              : "bg-gradient-to-br from-card to-card/95 border border-border/50 backdrop-blur-sm"
                          }`}
                        >
                          <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                            {message.content}
                          </div>

                          {/* Timestamp */}
                          <div
                            className={`text-xs mt-2 sm:mt-3 ${
                              message.type === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-muted to-muted/80 border border-border flex items-center justify-center">
                          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div className="bg-gradient-to-br from-card to-card/95 border border-border/50 rounded-2xl px-3 sm:px-4 py-3 sm:py-4 shadow-md">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 1, 0.3],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    delay: i * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                              Analyzing your query...
                              {jobId && ` (Job ID: ${jobId})`}
                              {pollingAttempts > 0 &&
                                ` (Attempt #${pollingAttempts})`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Questions */}
                <AnimatePresence>
                  {showQuickQuestions && messages.length === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]">
                        <div className="bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 rounded-2xl p-4 sm:p-6">
                          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            <span className="text-sm sm:text-base font-medium text-foreground">
                              Common Questions
                            </span>
                          </div>
                          <div className="grid gap-2 sm:gap-3">
                            {quickQuestions.map((question, index) => (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickQuestion(question)}
                                className="text-left text-xs sm:text-sm p-2 sm:p-3 rounded-xl bg-background/80 border border-border/30 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 text-foreground/80 hover:text-foreground"
                              >
                                {question}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border-t border-border/50 bg-gradient-to-r from-card/95 via-card/90 to-card/95 backdrop-blur-xl p-3 sm:p-4 lg:p-6"
            >
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex items-end space-x-2 sm:space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about medications, side effects, interactions, or general health questions..."
                      className="min-h-[44px] sm:min-h-[48px] pr-4 rounded-2xl border-2 border-border/50 focus:border-primary/70 text-sm sm:text-base bg-background/80 backdrop-blur-sm resize-none transition-all duration-200"
                      disabled={isTyping}
                      maxLength={500}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      {inputValue.length}/500
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      size="icon"
                      disabled={
                        !inputValue.trim() ||
                        isTyping ||
                        inputValue.length > 500
                      }
                      className="rounded-2xl w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </motion.div>
                </div>

                {/* Disclaimer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex items-center justify-center mt-3 sm:mt-4 px-2"
                >
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-center">
                      Educational information only • Always consult healthcare
                      professionals for medical advice
                    </span>
                  </div>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
