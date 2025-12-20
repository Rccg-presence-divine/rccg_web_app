"use client";

import React, { useState } from "react";

export default function AuthTester() {
  const [email, setEmail] = useState("sittiama@gmail.com");
  const [password, setPassword] = useState("newspassword");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      const maybeMessage = (err as { message?: unknown }).message;
      return typeof maybeMessage === "string"
        ? maybeMessage
        : String(maybeMessage);
    }
    return "Network error";
  }

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || `Login failed: ${res.status}`);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || "Login successful");
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || `Logout failed: ${res.status}`);
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.message || "Logged out");
      }
    } catch (err: unknown) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 p-4 border rounded bg-white">
      <h2 className="text-xl font-semibold mb-2">Auth Tester</h2>

      <form
        onSubmit={handleLogin}
        className="flex flex-col sm:flex-row gap-2 items-center"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          aria-label="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          aria-label="password"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Please wait..." : "Login"}
        </button>
        <button
          type="button"
          className="bg-gray-500 text-white px-4 py-2 rounded"
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </button>
      </form>

      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
