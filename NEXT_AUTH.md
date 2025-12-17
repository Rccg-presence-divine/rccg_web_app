# Guide Complet NextAuth.js

## Table des matières
1. [Installation](#installation)
2. [Configuration de base](#configuration-de-base)
3. [Providers d'authentification](#providers-dauthentification)
4. [Protection des routes](#protection-des-routes)
5. [Gestion des sessions](#gestion-des-sessions)
6. [Callbacks avancés](#callbacks-avancés)
7. [Exemples pratiques](#exemples-pratiques)

---

## Installation

```bash
npm install next-auth
# ou
yarn add next-auth
# ou
pnpm add next-auth
```

---

## Configuration de base

### 1. Structure du projet (App Router)

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts
├── login/
│   └── page.tsx
└── dashboard/
    └── page.tsx
```

### 2. Fichier de configuration principal

**`app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider avec Email/Password
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        // Récupérer l'utilisateur depuis la DB
        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Utilisateur non trouvé");
        }

        // Vérifier le mot de passe
        const isValid = await verifyPassword(
          user.password,
          credentials.password
        );

        if (!isValid) {
          throw new Error("Mot de passe incorrect");
        }

        // Retourner les données utilisateur (sans le mot de passe)
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }),

    // Provider Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Configuration des pages personnalisées
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },

  // Configuration de la session
  session: {
    strategy: "jwt", // Utilise JWT au lieu de database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  // Secret pour signer les JWT (OBLIGATOIRE en production)
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks pour personnaliser le comportement
  callbacks: {
    async jwt({ token, user, account }) {
      // Premier login: ajouter les infos de l'utilisateur au token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // Ajouter les infos du token à la session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Providers d'authentification

### 1. Credentials Provider (Email/Password)

```typescript
CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email", placeholder: "email@example.com" },
    password: { label: "Mot de passe", type: "password" }
  },
  async authorize(credentials) {
    // Votre logique de vérification
    const user = await verifyUser(credentials);
    
    if (user) {
      return user; // Retourne l'objet utilisateur
    }
    return null; // Retourne null si l'authentification échoue
  }
})
```

### 2. OAuth Providers (Google, GitHub, Facebook...)

```typescript
// Google
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
})

// GitHub
GitHubProvider({
  clientId: process.env.GITHUB_ID!,
  clientSecret: process.env.GITHUB_SECRET!,
})

// Facebook
FacebookProvider({
  clientId: process.env.FACEBOOK_ID!,
  clientSecret: process.env.FACEBOOK_SECRET!,
})
```

**Variables d'environnement `.env.local`**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-ultra-securise-generé-avec-openssl

GOOGLE_CLIENT_ID=votre-client-id-google
GOOGLE_CLIENT_SECRET=votre-client-secret-google

GITHUB_ID=votre-github-id
GITHUB_SECRET=votre-github-secret
```

**Générer NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Protection des routes

### 1. Protection côté serveur (Server Components)

**`app/dashboard/page.tsx`**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Rediriger si non authentifié
  if (!session) {
    redirect("/login");
  }

  // Vérifier le rôle
  if (session.user.role !== "SUPERADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1>Bienvenue, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>Rôle: {session.user.role}</p>
    </div>
  );
}
```

### 2. Protection côté client (Client Components)

**`app/profile/page.tsx`**

```typescript
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <h1>Profil de {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### 3. Middleware pour protéger plusieurs routes

**`middleware.ts`** (à la racine du projet)

```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
  ]
};
```

**Middleware avancé avec vérification de rôle:**

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Routes admin réservées aux SUPERADMIN
    if (path.startsWith("/admin") && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Routes modérateur pour MODERATOR et SUPERADMIN
    if (
      path.startsWith("/moderator") &&
      !["MODERATOR", "SUPERADMIN"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/moderator/:path*"],
};
```

---

## Gestion des sessions

### 1. Provider de session (Layout principal)

**`app/layout.tsx`**

```typescript
import { SessionProvider } from "@/components/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**`components/SessionProvider.tsx`**

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### 2. Utiliser la session dans les composants

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <button disabled>Chargement...</button>;
  }

  if (session) {
    return (
      <div>
        <p>Connecté en tant que {session.user.email}</p>
        <button onClick={() => signOut()}>Se déconnecter</button>
      </div>
    );
  }

  return <button onClick={() => signIn()}>Se connecter</button>;
}
```

---

## Callbacks avancés

### 1. Callback JWT

```typescript
callbacks: {
  async jwt({ token, user, account, profile, trigger, session }) {
    // Lors de la première connexion
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.phone = user.phone;
    }

    // Lors de la mise à jour de la session
    if (trigger === "update" && session) {
      token.name = session.name;
      token.email = session.email;
    }

    return token;
  },
}
```

### 2. Callback Session

```typescript
callbacks: {
  async session({ session, token }) {
    // Enrichir l'objet session avec les données du token
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.phone = token.phone as string;
    }
    return session;
  },
}
```

### 3. Callback SignIn

```typescript
callbacks: {
  async signIn({ user, account, profile, email, credentials }) {
    // Bloquer certains utilisateurs
    if (user.email === "banned@example.com") {
      return false; // Refuse la connexion
    }

    // Vérifier si l'email est vérifié (OAuth)
    if (account?.provider === "google" && !profile?.email_verified) {
      return false;
    }

    // Pour OAuth: créer l'utilisateur dans la DB s'il n'existe pas
    if (account?.provider === "google") {
      const existingUser = await prisma.users.findUnique({
        where: { email: user.email! }
      });

      if (!existingUser) {
        await prisma.users.create({
          data: {
            email: user.email!,
            name: user.name,
            role: "USER",
          }
        });
      }
    }

    return true; // Autorise la connexion
  },
}
```

---

## Exemples pratiques

### 1. Page de connexion complète

**`app/login/page.tsx`**

```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Connexion</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou</span>
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Continuer avec Google
        </button>
      </div>
    </div>
  );
}
```

### 2. Page d'inscription

**`app/register/page.tsx`**

```typescript
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Créer l'utilisateur
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      // Connecter automatiquement l'utilisateur
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError("Compte créé mais erreur de connexion");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Inscription</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 3. Hook personnalisé pour vérifier les rôles

**`hooks/useRole.ts`**

```typescript
import { useSession } from "next-auth/react";

export function useRole() {
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const isPastor = session?.user?.role === "PASTOR";
  const isModerator = session?.user?.role === "MODERATOR";
  const isUser = session?.user?.role === "USER";

  const hasRole = (roles: string[]) => {
    return roles.includes(session?.user?.role || "");
  };

  return {
    role: session?.user?.role,
    isSuperAdmin,
    isPastor,
    isModerator,
    isUser,
    hasRole,
  };
}
```

**Utilisation:**

```typescript
"use client";

import { useRole } from "@/hooks/useRole";

export function AdminPanel() {
  const { isSuperAdmin, hasRole } = useRole();

  if (!hasRole(["SUPERADMIN", "MODERATOR"])) {
    return <div>Accès refusé</div>;
  }

  return (
    <div>
      <h1>Panneau d'administration</h1>
      {isSuperAdmin && <button>Supprimer tout</button>}
    </div>
  );
}
```

### 4. Protection des routes API

**`app/api/admin/route.ts`**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Vérifier l'authentification
  if (!session) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // Vérifier le rôle
  if (session.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 }
    );
  }

  // Logique de votre API
  return NextResponse.json({ message: "Bienvenue, Super Admin!" });
}
```

### 5. Types TypeScript personnalisés

**`types/next-auth.d.ts`**

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string;
  }
}
```

---

## Configuration OAuth (Google)

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Activez "Google+ API"
4. Créez des identifiants OAuth 2.0

### 2. Configuration des redirections

**URIs de redirection autorisées:**
```
http://localhost:3000/api/auth/callback/google
https://votre-domaine.com/api/auth/callback/google
```

**Origines JavaScript autorisées:**
```
http://localhost:3000
https://votre-domaine.com
```

---

## Astuces et bonnes pratiques

### 1. Rafraîchir la session après mise à jour

```typescript
import { useSession } from "next-auth/react";

const { data: session, update } = useSession();

// Mettre à jour la session
await update({
  name: "Nouveau nom",
  email: "nouveau@email.com",
});
```

### 2. Déconnexion avec callback

```typescript
import { signOut } from "next-auth/react";

await signOut({
  callbackUrl: "/",
  redirect: true,
});
```

### 3. Vérifier si l'utilisateur est connecté (Server Component)

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
const isAuthenticated = !!session;
```

---

## Déploiement en production

### Variables d'environnement requises

```env
# OBLIGATOIRE en production
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre-secret-ultra-securise

# OAuth (si utilisé)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Sécurité

1. **Toujours** définir `NEXTAUTH_SECRET`
2. Utiliser HTTPS en production
3. Configurer correctement les CORS
4. Limiter les tentatives de connexion
5. Implémenter la validation côté serveur

---

## Ressources

- [Documentation officielle NextAuth.js](https://next-auth.js.org/)
- [Exemples NextAuth.js](https://github.com/nextauthjs/next-auth-example)
- [Configuration des providers](https://next-auth.js.org/providers/)

---

**Créé avec ❤️ pour votre projet**