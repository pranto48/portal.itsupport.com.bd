"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { useMonitorStore } from "@/store/use-monitor-store";
import { UserProfile, Organization } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const token = await firebaseUser.getIdToken();
          // Write token to cookie for Vercel edge middleware inspection
          document.cookie = `session-token=${token}; path=/; max-age=3600; SameSite=Strict; Secure`;

          // Asynchronously fetch full profile or provision if missing
          const db = getFirestore(app);
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userSnap.exists()) {
            const fullProfile = userSnap.data() as UserProfile;
            // Admin role override for specific administrative emails
            if (firebaseUser.email === "mail@arifmahmud.com" || firebaseUser.email === "arif@itsupport.com.bd") {
              fullProfile.role = "admin";
            }
            useMonitorStore.setState({ profile: fullProfile });
          } else {
            // Document doesn't exist, auto-provision user and organization (e.g. Google Sign-In first time)
            const mockOrgId = `org_${Date.now()}`;
            const orgData: Organization = {
              id: mockOrgId,
              name: `${firebaseUser.displayName || "Google"} Workspace`,
              createdAt: new Date().toISOString(),
              clientEmail: firebaseUser.email || "",
              licenseCount: 0,
              verified: false,
            };

            const userProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Google Operator",
              email: firebaseUser.email || "",
              role: (firebaseUser.email === "mail@arifmahmud.com" || firebaseUser.email === "arif@itsupport.com.bd") ? "admin" : "owner",
              orgId: mockOrgId,
              createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "organizations", mockOrgId), orgData);
            await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
            useMonitorStore.setState({ profile: userProfile });
          }
        } catch (e) {
          console.error("Failed to retrieve ID token or user profile:", e);
        }
      } else {
        setUser(null);
        // Clear session cookie unless auth bypass is active
        if (!document.cookie.includes("bypass-auth=true")) {
          document.cookie = "session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
