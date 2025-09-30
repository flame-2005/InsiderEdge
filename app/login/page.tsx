"use client";

import { useUserContext } from "@/context/UserContext";
import { useState } from "react";

export default function AuthPage() {
  const { user, loading, signOut, signInWithGoogle, signUpWithEmail, signInWithEmail } =
    useUserContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (loading) return <p>Loading...</p>;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.name || user.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Sign In / Sign Up</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={() => signUpWithEmail(email, password, name)}>Sign Up</button>
      <button onClick={() => signInWithEmail(email, password)}>Sign In</button>
      <hr />
      <button onClick={signInWithGoogle}>Sign In with Google</button>
    </div>
  );
}
