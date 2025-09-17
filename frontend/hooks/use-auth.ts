"use client";

import { useState, useEffect } from "react";

interface AuthState {
  phone: string;
  authenticated: boolean;
  timestamp: number;
}

interface UserProfile {
  name?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  chronicDiseases?: string[];
  allergies?: string[];
  familialHealthIssues?: string[];
  previousOperations?: string;
  avatar?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthState | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  const checkAuth = () => {
    try {
      const authData = localStorage.getItem("medico_auth");
      if (!authData) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const auth: AuthState = JSON.parse(authData);
      const isValid =
        auth.authenticated && Date.now() - auth.timestamp < 24 * 60 * 60 * 1000;

      if (isValid) {
        setIsAuthenticated(true);
        setUser(auth);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    }
  };

  const loadProfile = () => {
    try {
      const profileData = localStorage.getItem("medico_profile");
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.error("Profile load failed:", error);
    }
  };

  const updateProfile = (newProfile: UserProfile) => {
    try {
      localStorage.setItem("medico_profile", JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("medico_auth");
    localStorage.removeItem("medico_profile");
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
  };

  return {
    isAuthenticated,
    user,
    profile,
    updateProfile,
    logout,
    checkAuth,
  };
}
