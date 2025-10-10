"use client";

import { useEffect, useState } from "react";

export interface AuthUser {
  email: string;
  subscription?: {
    plan: string;
    expiresAt?: string;
  } | null;
}

interface UseAuthUserResult {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
}

export function useAuthUser(): UseAuthUserResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("booster_user")
          : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthUser;
          setUser(parsed);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("booster_token");
        localStorage.removeItem("booster_user");
      }
      setUser(null);
      try {
        window.location.href = "/";
      } catch {}
    } catch {}
  };

  return { user, isLoading, logout };
}
