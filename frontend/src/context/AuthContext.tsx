import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth";
import { authenticatedFetch } from "../services/authenticatedFetch";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  // void login(User user, char *token); in C
  logout: () => Promise<void>;
  verifyUser: () => Promise<boolean>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Shares an in-progress refresh request across all callers in this provider.
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  
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

  /**
   * Refreshes the access token using the session's HTTP-only refresh cookie.
   *
   * Concurrent callers reuse the same in-progress request, preventing
   * duplicate refresh calls from API requests and the proactive timer.
   *
   * @returns The new access token, or null if refresh fails.
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async (): Promise<string | null> => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (response.status === 401) {
          clearSession();
          return null;
        }

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();

        setUser(data.user);
        setToken(data.token);

        return data.token;
      } catch (error) {
        console.error("Failed to refresh access token:", error);
        return null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      if (refreshPromiseRef.current === refreshPromise) {
        refreshPromiseRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;
    let refreshTimer: ReturnType<typeof setTimeout>;

    const scheduleRefresh = (delay: number) => {
      refreshTimer = setTimeout(async () => {
        if (!isActive) {
          return;
        }

        const newToken = await refreshAccessToken();

        if (!isActive) {
          return;
        }

        if (!newToken) {
          scheduleRefresh(30_000);
        }
      }, delay);
    };

    scheduleRefresh(10 * 60 * 1000);

    return () => {
      isActive = false;
      clearTimeout(refreshTimer);
    };
  }, [token, refreshAccessToken]);

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

  
  /**
   * Verifies the current user, refreshing an expired access token and retrying
   * the request once when necessary.
   *
   * Only clears the session if authentication still fails with a 401.
   * Other server or network errors should not automatically log the user out.
   *
   * @returns True if the user is verified, otherwise false.
   */
  const verifyUser = async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const response = await authenticatedFetch(
        "/api/auth/me",
        token,
        refreshAccessToken,
      );

      if (response.status === 401) {
        clearSession();
        return false;
      }

      if (!response.ok) {
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
        refreshAccessToken,
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
