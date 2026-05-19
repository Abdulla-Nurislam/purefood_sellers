import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "../../lib/supabase";

export type AuthMethod = "phone" | "google";

export interface UserData {
  id?: string;
  authMethod: AuthMethod;
  phone?: string;
  companyName?: string;
  contactName?: string;
  categories?: string[];
  email?: string;
  avatarUrl?: string;
  address?: string;
  needsCompanyName?: boolean;
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // If logged in via Google OAuth, session.user.app_metadata.provider === 'google'
        // If phone auth, it's 'email' because of fake email
        if (session.user.app_metadata.provider === 'google') {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || email.split('@')[0] || '';
          const avatarUrl = session.user.user_metadata?.avatar_url || '';

          // Check if seller already has a company_name in DB
          let existingCompanyName = '';
          let needsCompanyName = true;
          try {
            const { data: sellerData } = await supabase
              .from('sellers')
              .select('company_name')
              .eq('id', session.user.id)
              .single();
            if (sellerData?.company_name && sellerData.company_name.trim()) {
              existingCompanyName = sellerData.company_name;
              needsCompanyName = false;
            }
          } catch {
            // Seller record may not exist yet
          }
          
          setUserState((prev) => {
            if (prev?.id === session.user.id && prev?.companyName) return prev;
            const googleUser: UserData = {
              id: session.user.id,
              authMethod: "google",
              companyName: existingCompanyName || '',
              contactName: name,
              email: email,
              avatarUrl: avatarUrl,
              categories: [],
              needsCompanyName,
            };
            saveUser(googleUser);
            return googleUser;
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
