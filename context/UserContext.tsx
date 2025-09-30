"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type User = {
  id: string;
  email: string;
  name?: string;
} | null;

type UserContextType = {
  user: User;
  loading: boolean;
  signOut: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const upsertUser = useMutation(api.user.upsertUser);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user;
      if (supabaseUser) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name,
        });

        await upsertUser({
          supabaseId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [upsertUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await supabase.auth.signInWithPassword({ email, password });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        signOut,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
