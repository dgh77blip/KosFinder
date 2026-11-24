import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { UserPrivateInfo, UserProfile, UserRole } from '../types/kos';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  privateInfo: UserPrivateInfo | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authDefaultRole: UserRole;
  openAuthModal: (mode?: 'login' | 'register', defaultRole?: UserRole) => void;
  closeAuthModal: () => void;
  loginOrRegisterWithGoogle: (opts: {
    mode: 'login' | 'register';
    role: UserRole;
    displayName?: string;
    whatsapp?: string;
  }) => Promise<UserProfile>;
  switchRole: (role: UserRole) => Promise<void>;
  updateContactWhatsapp: (whatsapp: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole>('pencari');

  const loadUserRecords = async (user: User): Promise<UserProfile | null> => {
    try {
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const privateSnap = await getDoc(doc(db, `users/${user.uid}/private`, 'info'));

      if (profileSnap.exists()) {
        const d = profileSnap.data();
        const loadedProfile: UserProfile = {
          uid: user.uid,
          displayName: String(d.displayName || user.displayName || 'Pengguna KosFinder'),
          role: d.role === 'pemilik' ? 'pemilik' : 'pencari',
        };
        setProfile(loadedProfile);

        if (privateSnap.exists()) {
          const p = privateSnap.data();
          setPrivateInfo({
            uid: user.uid,
            email: String(p.email || user.email || ''),
            whatsapp: String(p.whatsapp || ''),
          });
        } else {
          setPrivateInfo({
            uid: user.uid,
            email: user.email || '',
            whatsapp: '',
          });
        }
        return loadedProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const existingProfile = await loadUserRecords(user);
          if (!existingProfile) {
            // Auto-create default seeker profile if user signed in without register form
            const fallbackName = (user.displayName || user.email?.split('@')[0] || 'Pengguna').slice(0, 100);
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              displayName: fallbackName,
              role: 'pencari',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            await setDoc(doc(db, `users/${user.uid}/private`, 'info'), {
              uid: user.uid,
              email: (user.email || '').slice(0, 200),
              whatsapp: '',
              updatedAt: serverTimestamp(),
            });
            setProfile({
              uid: user.uid,
              displayName: fallbackName,
              role: 'pencari',
            });
            setPrivateInfo({
              uid: user.uid,
              email: user.email || '',
              whatsapp: '',
            });
          }
        } catch (err) {
          console.error('Failed loading profile:', err);
        }
      } else {
        setProfile(null);
        setPrivateInfo(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login', defaultRole: UserRole = 'pencari') => {
    setAuthModalMode(mode);
    setAuthDefaultRole(defaultRole);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const loginOrRegisterWithGoogle = async ({
    mode,
    role,
    displayName,
    whatsapp,
  }: {
    mode: 'login' | 'register';
    role: UserRole;
    displayName?: string;
    whatsapp?: string;
  }): Promise<UserProfile> => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const user = cred.user;
    const cleanName = (displayName?.trim() || user.displayName || user.email?.split('@')[0] || 'Pengguna').slice(0, 100);
    const cleanWa = (whatsapp?.trim() || '').slice(0, 25);

    const profileRef = doc(db, 'users', user.uid);
    const privateRef = doc(db, `users/${user.uid}/private`, 'info');
    const existingSnap = await getDoc(profileRef);

    let finalProfile: UserProfile;

    if (!existingSnap.exists()) {
      try {
        await setDoc(profileRef, {
          uid: user.uid,
          displayName: cleanName,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(privateRef, {
          uid: user.uid,
          email: (user.email || '').slice(0, 200),
          whatsapp: cleanWa,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
      }
      finalProfile = { uid: user.uid, displayName: cleanName, role };
    } else if (mode === 'register') {
      try {
        await updateDoc(profileRef, {
          displayName: cleanName,
          role,
          updatedAt: serverTimestamp(),
        });
        await setDoc(
          privateRef,
          {
            uid: user.uid,
            email: (user.email || '').slice(0, 200),
            whatsapp: cleanWa,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      finalProfile = { uid: user.uid, displayName: cleanName, role };
    } else {
      const loaded = await loadUserRecords(user);
      finalProfile = loaded || { uid: user.uid, displayName: cleanName, role };
    }

    setProfile(finalProfile);
    setPrivateInfo({
      uid: user.uid,
      email: user.email || '',
      whatsapp: cleanWa || privateInfo?.whatsapp || '',
    });
    setAuthModalOpen(false);
    return finalProfile;
  };

  const switchRole = async (nextRole: UserRole) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      });
      setProfile((prev) => (prev ? { ...prev, role: nextRole } : prev));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const updateContactWhatsapp = async (whatsapp: string, displayName: string) => {
    if (!firebaseUser) return;
    const cleanWa = whatsapp.trim().slice(0, 25);
    const cleanName = displayName.trim().slice(0, 100);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: cleanName || profile?.displayName || 'Pengguna',
        updatedAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, `users/${firebaseUser.uid}/private`, 'info'),
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          whatsapp: cleanWa,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((prev) => (prev ? { ...prev, displayName: cleanName || prev.displayName } : prev));
      setPrivateInfo((prev) =>
        prev ? { ...prev, whatsapp: cleanWa } : { uid: firebaseUser.uid, email: firebaseUser.email || '', whatsapp: cleanWa }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
    setPrivateInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        privateInfo,
        loading,
        authModalOpen,
        authModalMode,
        authDefaultRole,
        openAuthModal,
        closeAuthModal,
        loginOrRegisterWithGoogle,
        switchRole,
        updateContactWhatsapp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
