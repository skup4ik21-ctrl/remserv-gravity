import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole === UserRole.Administrator;
  const isManager = userRole === UserRole.Manager || userRole === UserRole.Administrator;

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        console.log("Logged in user UID:", firebaseUser.uid);
        setUser(firebaseUser);
        try {
          // Super-admin bypass
          if (firebaseUser.uid === 'CNJ4Lbz6KbM0vNOPAJjclEVA7Ju1') {
            setUserRole(UserRole.Administrator);
          } else {
            const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (docSnap.exists()) {
              setUserRole(docSnap.data()?.role as UserRole);
            } else {
              console.warn("User profile not created in Firestore.");
              setUserRole(null);
            }
          }
        } catch (error) {
          console.error("Auth role fetch error:", error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, isAdmin, isManager, loading, logout: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
};