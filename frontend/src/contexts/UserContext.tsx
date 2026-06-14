"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLogin?: string;
  createdAt?: string;
};

type UserContextType = {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
};

const defaultProfile: UserProfile = {
  firstName: "Bella",
  lastName: "Williamson",
  email: "bella@pulsecrm.com",
  role: "Marketing Admin",
  avatarUrl: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fetch from backend
    fetch("http://localhost:5000/api/settings/profile", {
      headers: {
        "Authorization": "Bearer default-demo-user-token"
      }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    })
    .then(data => {
      setProfile(data);
      setIsLoaded(true);
    })
    .catch(err => {
      console.error(err);
      setIsLoaded(true); // fallback to defaultProfile
    });
  }, []);

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
    try {
      await fetch("http://localhost:5000/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer default-demo-user-token"
        },
        body: JSON.stringify(newProfile)
      });
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  if (!isLoaded) return null;

  return (
    <UserContext.Provider value={{ profile, setProfile, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
