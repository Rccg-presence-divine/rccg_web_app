"use client";
import React, { useState } from "react";

export default function TestAuthPage() {
  const [loginEmail, setLoginEmail] = useState<string>("sittiama@gmail.com");
  const [loginPassword, setLoginPassword] = useState<string>("newspassword");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  type Result = { type: "success" | "error"; message: string };
  const [loginResult, setLoginResult] = useState<Result | null>(null);
  const [logoutResult, setLogoutResult] = useState<Result | null>(null);
  const [protectedResult, setProtectedResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<{
    login: boolean;
    logout: boolean;
    protected: boolean;
  }>({ login: false, logout: false, protected: false });

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      const maybe = (err as { message?: unknown }).message;
      return typeof maybe === "string" ? maybe : String(maybe);
    }
    return "Erreur réseau";
  }

  // Test Login
  const testLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginResult({
        type: "error",
        message: "Veuillez remplir tous les champs",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, login: true }));
    setLoginResult(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: "include",
      });

      const data: any = await response.json().catch(() => null);

      if (response.ok) {
        setAccessToken(typeof data?.token === "string" ? data.token : null);
        setLoginResult({
          type: "success",
          message: `✅ Connexion réussie!\n\nStatus: ${
            response.status
          }\n\nAccess Token: ${
            typeof data?.token === "string"
              ? data.token.substring(0, 50) + "..."
              : "N/A"
          }\n\nUser: ${JSON.stringify(
            data?.user ?? {},
            null,
            2
          )}\n\n🍪 Le refresh_token a été enregistré dans les cookies!`,
        });
      } else {
        setLoginResult({
          type: "error",
          message: `❌ Erreur ${response.status}\n\n${JSON.stringify(
            data ?? {},
            null,
            2
          )}`,
        });
      }
    } catch (error: unknown) {
      setLoginResult({
        type: "error",
        message: `❌ Erreur réseau\n\n${getErrorMessage(error)}`,
      });
    } finally {
      setLoading((prev) => ({ ...prev, login: false }));
    }
  };

  // Test Logout
  const testLogout = async () => {
    setLoading((prev) => ({ ...prev, logout: true }));
    setLogoutResult(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const data: any = await response.json().catch(() => null);

      if (response.ok) {
        setAccessToken(null);
        setLogoutResult({
          type: "success",
          message: `✅ Déconnexion réussie!\n\nStatus: ${
            response.status
          }\n\nMessage: ${
            data?.message ?? "OK"
          }\n\n🍪 Le refresh_token a été supprimé des cookies!`,
        });
      } else {
        setLogoutResult({
          type: "error",
          message: `❌ Erreur ${response.status}\n\n${JSON.stringify(
            data ?? {},
            null,
            2
          )}`,
        });
      }
    } catch (error: unknown) {
      setLogoutResult({
        type: "error",
        message: `❌ Erreur réseau\n\n${getErrorMessage(error)}`,
      });
    } finally {
      setLoading((prev) => ({ ...prev, logout: false }));
    }
  };

  // Test Route Protégée
  const testProtectedRoute = async () => {
    if (!accessToken) {
      setProtectedResult({
        type: "error",
        message:
          "❌ Vous devez d'abord vous connecter pour obtenir un access token!",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, protected: true }));
    setProtectedResult(null);

    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });

      const data: any = await response.json().catch(() => null);

      if (response.ok) {
        setProtectedResult({
          type: "success",
          message: `✅ Route protégée accessible!\n\nStatus: ${
            response.status
          }\n\nRéponse: ${JSON.stringify(data ?? {}, null, 2)}`,
        });
      } else {
        setProtectedResult({
          type: "error",
          message: `❌ Erreur ${response.status}\n\n${JSON.stringify(
            data ?? {},
            null,
            2
          )}`,
        });
      }
    } catch (error: unknown) {
      setProtectedResult({
        type: "error",
        message: `❌ Erreur réseau\n\n${getErrorMessage(error)}`,
      });
    } finally {
      setLoading((prev) => ({ ...prev, protected: false }));
    }
  };

  const ResultBox: React.FC<{ result: Result | null }> = ({ result }) => {
    if (!result) return null;
    return (
      <div
        className={`mt-4 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap ${
          result.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        {result.message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">
          🔐 Test Authentication API
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          Testez vos endpoints d'authentification avec gestion des cookies
        </p>

        {/* Section Login */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-l-4 border-purple-600">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🚪</span> Login
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              placeholder="exemple@email.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={testLogin}
            disabled={loading.login}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.login ? "⏳ Connexion..." : "Se connecter"}
          </button>

          <ResultBox result={loginResult} />
        </div>

        <div className="h-px bg-gray-200 my-8"></div>

        {/* Section Logout */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-l-4 border-pink-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🚪</span> Logout
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Assurez-vous d'être connecté avant de vous déconnecter
          </p>

          <button
            onClick={testLogout}
            disabled={loading.logout}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.logout ? "⏳ Déconnexion..." : "Se déconnecter"}
          </button>

          <ResultBox result={logoutResult} />
        </div>

        <div className="h-px bg-gray-200 my-8"></div>

        {/* Section Route Protégée */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔒</span> Test Route Protégée
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Testez une route protégée qui nécessite un access token
          </p>

          <button
            onClick={testProtectedRoute}
            disabled={loading.protected}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.protected
              ? "⏳ Test en cours..."
              : "Tester /api/categories"}
          </button>

          <ResultBox result={protectedResult} />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
          <strong>ℹ️ Info:</strong> Les cookies sont automatiquement gérés par
          le navigateur avec l'option{" "}
          <code className="bg-yellow-100 px-2 py-1 rounded">
            credentials: 'include'
          </code>
        </div>
      </div>
    </div>
  );
}
