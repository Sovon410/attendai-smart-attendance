import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);
  const navigate = useNavigate();

  const login = useCallback(
    (token, user) => {
      setStoredAuth(token, user);
      setAuth({ token, user });
      navigate(user.role === "teacher" ? "/teacher" : "/student");
    },
    [navigate]
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth({ token: null, user: null });
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuth({ token: null, user: null });
      navigate("/");
    };
    window.addEventListener("attendai:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("attendai:unauthorized", handleUnauthorized);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
