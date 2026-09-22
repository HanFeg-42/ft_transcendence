import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  // void login(User user, char *token); in C
  logout: () => Promise<void>;
  verifyUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (isActive) {
          setUser(data.user);
          setToken(data.token);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
  };

  const logout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to log out");
    }

    clearSession();
  };

  const verifyUser = async () => {
    if (!token) {
      return false;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        clearSession();
        return false;
      }

      const data = await response.json();

      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Failed to verify current user:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        verifyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
