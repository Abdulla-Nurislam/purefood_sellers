import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthMethod = "phone" | "google";

export interface UserData {
  id?: string;
  authMethod: AuthMethod;
  phone?: string;
  companyName?: string;
  contactName?: string;
  categories?: string[];
  email?: string;
  address?: string;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  updateUser: (partial: Partial<UserData>) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function loadUser(): UserData | null {
  try {
    const stored = localStorage.getItem("purefood_seller_user");
    return stored ? (JSON.parse(stored) as UserData) : null;
  } catch {
    return null;
  }
}

function saveUser(user: UserData | null) {
  if (user) {
    localStorage.setItem("purefood_seller_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("purefood_seller_user");
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(loadUser);

  const setUser = (userData: UserData | null) => {
    setUserState(userData);
    saveUser(userData);
  };

  const updateUser = (partial: Partial<UserData>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      saveUser(updated);
      return updated;
    });
  };

  const logout = () => setUser(null);

  return (
    <UserContext.Provider
      value={{ user, setUser, updateUser, isAuthenticated: !!user, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
