# 🔒 Guide Sécurité API Next.js - Stack Complète 2025

## 🧠 TL;DR

Tu as déjà **Prisma + Zod** → c'est une très bonne base.

Il te manque **4 briques essentielles** pour une API réellement sécurisée, sans sur-ingénierie.

---

## 🧱 Stack Minimale Recommandée (2025)

| Composant          | Rôle                     | Statut      |
| ------------------ | ------------------------ | ----------- |
| ✅ **Zod**         | Validation des données   | ✅ OK       |
| ✅ **Prisma**      | Accès base de données    | ✅ OK       |
| ❌ **Auth**        | Identifier l'utilisateur | ❌ Manquant |
| ❌ **JWT/Session** | Prouver l'identité       | ❌ Manquant |
| ❌ **RBAC**        | Gérer les rôles          | ❌ Manquant |
| ❌ **Rate Limit**  | Bloquer les abus         | ❌ Manquant |

---

## 1️⃣ Authentification (OBLIGATOIRE)

### 🎯 Objectif

Savoir **QUI** appelle ton API.

### Fonctionnalités nécessaires

- `login`
- `register`
- `logout`

### 🛠 Outils recommandés

- **`bcrypt`** ou **`argon2`** (hashing mots de passe)
- **`jsonwebtoken`** (JWT)

### 👉 Pourquoi JWT ?

- ✅ Simple
- ✅ Stateless
- ✅ Parfait pour API

### 📦 Installation

```bash
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

### Exemple de base

```typescript
// register.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const hashedPassword = await bcrypt.hash(password, 10);
// Sauvegarder user avec Prisma

// login.ts
const isValid = await bcrypt.compare(password, user.password);
if (isValid) {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
  return { token };
}
```

---

## 2️⃣ Middleware d'Authentification (TRÈS IMPORTANT)

### 🎯 Objectif

Bloquer toute requête sans token valide.

### Format du header

```
Authorization: Bearer <token>
```

### 📝 Exemple Middleware

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function authMiddleware(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // Attacher l'user à la requête
    return decoded;
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
```

### 👉 À mettre sur toutes les routes protégées

---

## 3️⃣ Autorisation (RBAC) – QUI A LE DROIT DE FAIRE QUOI

### 🎯 Objectif

Empêcher :

- ❌ Un `USER` de supprimer d'autres users
- ❌ Un éditeur d'agir comme `ADMIN`

### Minimum viable

```typescript
enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}
```

### 📝 Exemple dans Prisma Schema

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  role     Role   @default(USER)
}

enum Role {
  USER
  ADMIN
}
```

### Middleware de rôle

```typescript
// middleware/rbac.ts
export function requireRole(allowedRoles: Role[]) {
  return (user: User) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Forbidden");
    }
  };
}

// Usage
requireRole([Role.ADMIN])(currentUser);
```

---

## 4️⃣ Rate Limiting (ANTI-ABUS)

### 🎯 Objectif

Bloquer :

- 🚫 Brute force login
- 🚫 Spam API
- 🚫 Bots

### 🛠 Outils simples

- **Upstash** (simple, Redis cloud)
- Middleware maison (basique)

### 📦 Avec Upstash

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function rateLimitMiddleware(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
}
```

---

## 5️⃣ Sécurité HTTP (facultatif mais recommandé)

### 🎯 Objectif

Protéger contre :

- XSS
- Sniffing
- Attaques classiques

### 🛠 Outil

- **Helmet** (si Node classique)
- En Next.js → `headers` via `next.config.js`

### 📝 Configuration Next.js

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};
```

---

## 🧩 Récapitulatif : Ce que TU AS déjà (bravo)

| Outil      | Statut | Fonction               |
| ---------- | ------ | ---------------------- |
| Zod        | ✅     | Validation des données |
| Prisma     | ✅     | ORM base de données    |
| Validation | ✅     | Contrôle des entrées   |
| Typage     | ✅     | TypeScript             |

---

## ❌ Ce que tu n'as PAS encore (par priorité)

| Priorité | Composant manquant    |
| -------- | --------------------- |
| 🔥🔥🔥   | Auth (login/register) |
| 🔥🔥     | Middleware JWT        |
| 🔥       | Rôles (RBAC)          |
| 🔥       | Rate limiting         |

---

## 🚀 Plan d'Implémentation SIMPLE (recommandé)

### Étape 1 (immédiat)

- [ ] Installer `bcrypt` / `argon2`
- [ ] Installer `jsonwebtoken`
- [ ] Créer routes `register` + `login`

### Étape 2

- [ ] Créer middleware auth global
- [ ] Protéger les routes sensibles

### Étape 3

- [ ] Ajouter rôles dans Prisma (`ADMIN` / `USER`)
- [ ] Implémenter contrôle d'accès par rôle

### Étape 4

- [ ] Ajouter rate limiting (Upstash ou custom)

---

## 🧠 Règle d'Or Backend

```diff
- ❌ Frontend ≠ Sécurité
+ ✅ Backend = Seule source de vérité
```

**Jamais faire confiance aux données du client.**

Toujours :

1. ✅ Valider côté serveur (Zod)
2. ✅ Vérifier l'authentification (JWT)
3. ✅ Contrôler les permissions (RBAC)
4. ✅ Limiter les requêtes (Rate Limit)

---

## 🏁 Conclusion

### 👉 Aujourd'hui, avec Prisma + Zod, tu dois ajouter :

| Composant                 | Rôle                         |
| ------------------------- | ---------------------------- |
| 🔐 **Auth (JWT)**         | Identifier l'utilisateur     |
| 👮 **Middleware d'accès** | Bloquer les non-authentifiés |
| 🧱 **Rôles (RBAC)**       | Gérer les permissions        |
| 🚦 **Rate Limit**         | Prévenir les abus            |

**C'est le minimum professionnel pour une API sérieuse en 2025.**

---

## 📚 Ressources Complémentaires

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [JWT.io](https://jwt.io/)

---

**Made with 💙 for secure APIs**
