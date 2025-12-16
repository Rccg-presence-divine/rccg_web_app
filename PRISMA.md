# Guide d'utilisation de Prisma ORM avec Next.js 15

> Guide complet pour configurer et utiliser Prisma ORM dans une application Next.js et la déployer sur Vercel

## 📋 Table des matières

- [Introduction](#introduction)
- [Prérequis](#prérequis)
- [Configuration du projet](#1-configuration-du-projet)
- [Installation et configuration de Prisma](#2-installation-et-configuration-de-prisma)
- [Requêtes à la base de données](#3-requêtes-à-la-base-de-données)
- [Création des pages](#4-6-création-des-pages)
- [Déploiement sur Vercel](#7-déploiement-sur-vercel)
- [Prochaines étapes](#8-prochaines-étapes)

## Introduction

Ce guide vous montre comment utiliser Prisma avec Next.js 15, un framework React fullstack. Vous apprendrez à :

- Créer une instance Prisma Postgres
- Configurer Prisma ORM avec Next.js
- Gérer les migrations
- Déployer votre application sur Vercel

**Temps estimé :** 20 minutes

**Exemple de déploiement :** [GitHub - prisma-examples](https://github.com/prisma/prisma-examples/blob/latest/orm/nextjs)

## Prérequis

- [Node.js 20+](https://nodejs.org)
- Un compte Vercel (pour le déploiement)

## 1. Configuration du projet

Créez une nouvelle application Next.js :

```bash
npx create-next-app@latest nextjs-prisma
```

Sélectionnez les options par défaut :
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ❌ Pas de répertoire `src`
- ✅ App Router
- ✅ Turbopack
- ❌ Pas d'alias d'importation personnalisé

Naviguez vers le répertoire du projet :

```bash
cd nextjs-prisma
```

## 2. Installation et configuration de Prisma

### 2.1. Installation des dépendances

```bash
npm install prisma tsx @types/pg --save-dev
npm install @prisma/client @prisma/adapter-pg dotenv pg
```

> **Note :** Pour MySQL, SQL Server ou SQLite, installez l'adaptateur correspondant.

Initialisez Prisma :

```bash
npx prisma init --db --output ../app/generated/prisma
```

Vous devrez répondre à quelques questions pour configurer votre base de données Prisma Postgres.

**Fichiers créés :**
- `prisma/schema.prisma` - Schéma de la base de données
- `prisma.config.ts` - Configuration Prisma
- Base de données Prisma Postgres
- `.env` - Variable `DATABASE_URL`
- `app/generated/prisma` - Répertoire de sortie du client Prisma

### 2.2. Définition du schéma Prisma

Modifiez `prisma/schema.prisma` :

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  authorId  Int
  author    User    @relation(fields: [authorId], references: [id])
}
```

### 2.3. Configuration de dotenv

Ajoutez l'import de `dotenv` dans `prisma.config.ts` :

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

### 2.4. Exécution des migrations

Créez les tables de la base de données :

```bash
npx prisma migrate dev --name init
```

Générez le client Prisma :

```bash
npx prisma generate
```

### 2.5. Seed de la base de données

Créez `prisma/seed.ts` :

```typescript
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "alice@prisma.io",
    posts: {
      create: [
        {
          title: "Join the Prisma Discord",
          content: "https://pris.ly/discord",
          published: true,
        },
        {
          title: "Prisma on YouTube",
          content: "https://pris.ly/youtube",
        },
      ],
    },
  },
  {
    name: "Bob",
    email: "bob@prisma.io",
    posts: {
      create: [
        {
          title: "Follow Prisma on Twitter",
          content: "https://www.twitter.com/prisma",
          published: true,
        },
      ],
    },
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
```

Mettez à jour `prisma.config.ts` :

```typescript
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: `tsx prisma/seed.ts`,
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

> ⚠️ **Attention :** Si vous utilisez Next.js v15.2.0 ou v15.2.1, désactivez Turbopack dans `package.json` :

```json
"scripts": {
  "dev": "next dev",
}
```

Exécutez le seed :

```bash
npx prisma db seed
```

Ouvrez Prisma Studio pour inspecter vos données :

```bash
npx prisma studio
```

### 2.6. Configuration du client Prisma

Créez `lib/prisma.ts` :

```bash
mkdir -p lib && touch lib/prisma.ts
```

Ajoutez le code suivant :

```typescript
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

## 3. Requêtes à la base de données

### Page d'accueil dynamique

Modifiez `app/page.tsx` :

```tsx
import prisma from '@/lib/prisma'

export default async function Home() {
  const users = await prisma.user.findMany();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
      <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)] text-[#333333]">
        Superblog
      </h1>
      <ol className="list-decimal list-inside font-[family-name:var(--font-geist-sans)]">
        {users.map((user) => (
          <li key={user.id} className="mb-2">
            {user.name}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

## 4. Page liste des posts

Créez `app/posts/page.tsx` :

```bash
mkdir -p app/posts && touch app/posts/page.tsx
```

```tsx
import prisma from "@/lib/prisma";

export default async function Posts() {
  const posts = await prisma.post.findMany({
    include: {
      author: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16 text-[#333333]">
      <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)]">
        Posts
      </h1>
      <ul className="font-[family-name:var(--font-geist-sans)] max-w-2xl space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <span className="font-semibold">{post.title}</span>
            <span className="text-sm text-gray-600 ml-2">
              by {post.author.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 5. Page détails d'un post

Créez `app/posts/[id]/page.tsx` :

```bash
mkdir -p "app/posts/[id]" && touch "app/posts/[id]/page.tsx"
```

```tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
      <article className="max-w-2xl space-y-4 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-4xl font-bold mb-8 text-[#333333]">{post.title}</h1>
        <p className="text-gray-600 text-center">by {post.author.name}</p>
        <div className="prose prose-gray mt-8">
          {post.content || "No content available."}
        </div>
      </article>
    </div>
  );
}
```

## 6. Page création d'un post

Créez `app/posts/new/page.tsx` :

```bash
mkdir -p app/posts/new && touch app/posts/new/page.tsx
```

```tsx
import Form from "next/form";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default function NewPost() {
  async function createPost(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    await prisma.post.create({
      data: {
        title,
        content,
        authorId: 1,
      },
    });

    revalidatePath("/posts");
    redirect("/posts");
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <Form action={createPost} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter your post title"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-lg mb-2">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            placeholder="Write your post content here..."
            rows={6}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
        >
          Create Post
        </button>
      </Form>
    </div>
  );
}
```

## 7. Déploiement sur Vercel

### Installation de la CLI Vercel

```bash
npm install -g vercel
```

### Connexion à Vercel

```bash
vercel login
```

### Configuration du script postinstall

Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "postinstall": "prisma generate",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Déploiement

```bash
vercel
```

Votre application est maintenant déployée ! 🎉

## 8. Prochaines étapes

Améliorez votre application en ajoutant :

- ✅ Authentification pour protéger vos routes
- ✅ Fonctionnalités d'édition et suppression de posts
- ✅ Système de commentaires
- ✅ Utilisation de [Prisma Studio](https://www.prisma.io/studio) pour la gestion visuelle

## 📚 Ressources

- [Documentation Prisma ORM](https://www.prisma.io/docs/orm)
- [Référence API Prisma Client](https://www.prisma.io/docs/orm/prisma-client)
- [Documentation Next.js](https://nextjs.org/docs)

---

**Créé avec ❤️ par Prisma**