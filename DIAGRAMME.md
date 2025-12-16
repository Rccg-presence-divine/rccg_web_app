# 📊 Documentation du Schéma de Base de Données - Application d'Église

## 🎯 Vue d'ensemble

Ce schéma représente une **application de gestion d'église/communauté religieuse** avec système de gestion de contenu, authentification multi-rôles, et notifications en temps réel.

**Base de données :** PostgreSQL  
**ORM :** Prisma  
**Output Client :** `../src/app/generated/prisma`

---

## 📋 Table des Matières

- [Énumérations](#-énumérations)
- [Modèles et Relations](#-modèles-et-relations)
- [Diagramme ER](#-diagramme-er)
- [Relations Détaillées](#-relations-détaillées)
- [Fonctionnalités du Schéma](#-fonctionnalités-du-schéma)
- [Guide d'Utilisation](#-guide-dutilisation)

---

## 🏷️ Énumérations

### Role
```prisma
enum Role {
  SUPERADMIN    // Administrateur principal (accès total)
  PASTOR        // Pasteur (gestion spirituelle + contenu)
  MODERATOR     // Modérateur (gestion du contenu)
  USER          // Utilisateur standard (lecture + témoignages)
}
```

**Hiérarchie des permissions :**
```
SUPERADMIN > PASTOR > MODERATOR > USER
```

---

## 📦 Modèles et Relations

### 1️⃣ **Users** (Utilisateurs) - Modèle Central

**Table :** `Users`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `email` | String | UNIQUE | Email de connexion |
| `name` | String? | Nullable | Nom complet |
| `password` | String | Required | Hash du mot de passe |
| `phone` | String? | Nullable | Numéro de téléphone |
| `role` | Role | Default: USER | Rôle de l'utilisateur |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
- `testimonies` → Testimonies[] (1:N)
- `events` → Events[] (1:N)
- `announcements` → Announcements[] (1:N)
- `videos` → Videos[] (1:N)
- `categories` → Categories[] (1:N)
- `readNotifications` → Read_Notifications[] (1:N)

**Comportement :**
- ✅ Suppression en cascade sur tous les contenus liés
- ✅ Timestamps automatiques
- ✅ Email unique (pas de doublons)

---

### 2️⃣ **Testimonies** (Témoignages)

**Table :** `Testimonies`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | Required | Titre du témoignage |
| `content` | String | Required | Contenu complet |
| `datePosted` | DateTime | Auto | Date de publication |
| `userId` | Int | FK | Auteur du témoignage |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Testimonies (N) → (1) Users [CASCADE DELETE]
```

**Cas d'usage :**
- Témoignages de foi des membres
- Histoires de transformation
- Expériences spirituelles

---

### 3️⃣ **Events** (Événements)

**Table :** `Events`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | Required | Titre de l'événement |
| `description` | String | Required | Description complète |
| `eventDate` | DateTime | Required | Date/heure de l'événement |
| `userId` | Int | FK | Organisateur |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Events (N) → (1) Users [CASCADE DELETE]
```

**Cas d'usage :**
- Cultes et services
- Événements spéciaux (Noël, Pâques)
- Conférences et séminaires
- Activités communautaires

---

### 4️⃣ **Announcements** (Annonces)

**Table :** `Announcements`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | Required | Titre de l'annonce |
| `content` | String | Required | Contenu de l'annonce |
| `datePosted` | DateTime | Auto | Date de publication |
| `userId` | Int | FK | Auteur de l'annonce |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Announcements (N) → (1) Users [CASCADE DELETE]
```

**Cas d'usage :**
- Annonces d'événements urgents
- Changements d'horaires
- Informations importantes
- Messages du pasteur

---

### 5️⃣ **Videos** (Vidéos/Prédications)

**Table :** `Videos`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | Required | Titre de la vidéo |
| `description` | String? | Nullable | Description |
| `preacher` | String | Required | Nom du prédicateur |
| `datePreached` | DateTime | Required | Date de la prédication |
| `audioUrl` | String? | Nullable | Lien audio |
| `videoUrl` | String? | Nullable | Lien vidéo direct |
| `youtubeID` | String? | Nullable | ID vidéo YouTube |
| `thumbnailUrl` | String? | Nullable | Miniature |
| `userId` | Int | FK | Uploader |
| `categoryId` | Int | FK | Catégorie |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Videos (N) → (1) Users [CASCADE DELETE]
Videos (N) → (1) Categories [CASCADE DELETE]
```

**Cas d'usage :**
- Prédications enregistrées
- Enseignements bibliques
- Témoignages vidéo
- Études bibliques

**Support multi-plateformes :**
- ✅ Upload direct (`videoUrl`)
- ✅ YouTube embed (`youtubeID`)
- ✅ Audio uniquement (`audioUrl`)

---

### 6️⃣ **Categories** (Catégories)

**Table :** `Categories`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | UNIQUE | Nom de la catégorie |
| `description` | String? | Nullable | Description |
| `userId` | Int | FK | Créateur |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Categories (1) → (N) Videos
Categories (N) → (1) Users
```

**Exemples de catégories :**
- "Culte du dimanche"
- "Étude biblique"
- "Séminaire"
- "Jeunesse"
- "Témoignages"

**Note :** La suppression d'une catégorie supprime toutes les vidéos associées (CASCADE).

---

### 7️⃣ **Notifications** (Notifications)

**Table :** `Notifications`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `title` | String | Required | Titre de la notification |
| `message` | String | Required | Contenu du message |
| `dateSent` | DateTime | Auto | Date d'envoi |
| `createdAt` | DateTime | Auto | Date de création |
| `updatedAt` | DateTime | Auto | Dernière modification |

**Relations :**
```
Notifications (1) ←→ (N) Read_Notifications
```

**Cas d'usage :**
- Rappels d'événements
- Nouvelles annonces
- Nouvelles vidéos
- Messages administratifs

---

### 8️⃣ **Read_Notifications** (Table de Jonction)

**Table :** `Read_Notifications`

| Champ | Type | Contrainte | Description |
|-------|------|-----------|-------------|
| `id` | Int | PK, Auto | Identifiant unique |
| `userId` | Int | FK | Utilisateur concerné |
| `notificationId` | Int | FK | Notification |
| `read` | Boolean | Default: false | Statut de lecture |
| `dateRead` | DateTime | Auto | Date de lecture |

**Relations :**
```
Read_Notifications (N) → (1) Users [CASCADE DELETE]
Read_Notifications (N) → (1) Notifications [CASCADE DELETE]
```

**Fonctionnement :**
1. Une notification est créée
2. Une entrée `Read_Notifications` est créée pour chaque utilisateur
3. Quand l'utilisateur lit la notification → `read = true`

**Avantages :**
- ✅ Suivi individuel par utilisateur
- ✅ Historique des lectures
- ✅ Notifications non lues faciles à récupérer

---

## 🔄 Diagramme ER

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                              │
│  (Hub Central - Role: SUPERADMIN|PASTOR|MODERATOR|USER)    │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──────────→ Testimonies (1:N) [CASCADE]
              │
              ├──────────→ Events (1:N) [CASCADE]
              │
              ├──────────→ Announcements (1:N) [CASCADE]
              │
              ├──────────→ Videos (1:N) [CASCADE]
              │                 │
              │                 └──→ Categories (N:1) [CASCADE]
              │                         ↑
              ├─────────────────────────┘ (1:N)
              │
              └──────────→ Read_Notifications (1:N) [CASCADE]
                                   │
                                   └──→ Notifications (N:1) [CASCADE]
```

---

## 🔗 Relations Détaillées

### Relation 1:N (One-to-Many)

#### Users → Testimonies
```typescript
// Un utilisateur peut écrire plusieurs témoignages
user.testimonies // Testimonies[]
testimony.user   // Users
```

#### Users → Events
```typescript
// Un utilisateur peut créer plusieurs événements
user.events    // Events[]
event.user     // Users
```

#### Users → Announcements
```typescript
// Un utilisateur peut publier plusieurs annonces
user.announcements  // Announcements[]
announcement.user   // Users
```

#### Users → Videos
```typescript
// Un utilisateur peut uploader plusieurs vidéos
user.videos   // Videos[]
video.user    // Users
```

#### Users → Categories
```typescript
// Un utilisateur peut créer plusieurs catégories
user.categories  // Categories[]
category.user    // Users
```

#### Categories → Videos
```typescript
// Une catégorie contient plusieurs vidéos
category.videos  // Videos[]
video.category   // Categories
```

### Relation N:M (Many-to-Many via table de jonction)

#### Users ←→ Notifications
```typescript
// Système de notifications avec suivi de lecture
user.readNotifications           // Read_Notifications[]
notification.readNotifications   // Read_Notifications[]

// Récupérer les notifications non lues d'un utilisateur
const unreadNotifications = await prisma.read_Notifications.findMany({
  where: {
    userId: 1,
    read: false
  },
  include: {
    notification: true
  }
})
```

---

## ✨ Fonctionnalités du Schéma

### 🔐 Sécurité et Intégrité

#### 1. Suppression en Cascade
```prisma
onDelete: Cascade
```
- ✅ Suppression d'un utilisateur → supprime tous ses contenus
- ✅ Suppression d'une catégorie → supprime toutes ses vidéos
- ✅ Suppression d'une notification → supprime tous les statuts de lecture

#### 2. Contraintes d'Unicité
```prisma
@unique
```
- `Users.email` : Pas de doublons d'emails
- `Categories.title` : Pas de catégories en double

#### 3. Valeurs par Défaut
```prisma
@default()
```
- `Users.role` : USER (nouvel inscrit = utilisateur standard)
- `Read_Notifications.read` : false (non lu par défaut)
- Tous les `datePosted`, `dateSent` : now() (timestamp auto)

### ⏰ Timestamps Automatiques

Tous les modèles incluent :
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Avantages :**
- Suivi de la création
- Suivi des modifications
- Audit trail complet

### 🎭 Système de Rôles

```typescript
enum Role {
  SUPERADMIN  // Gestion totale
  PASTOR      // Contenu spirituel + modération
  MODERATOR   // Modération contenu
  USER        // Lecture + témoignages
}
```

**Permissions suggérées :**

| Action | USER | MODERATOR | PASTOR | SUPERADMIN |
|--------|------|-----------|--------|------------|
| Lire contenu | ✅ | ✅ | ✅ | ✅ |
| Créer témoignage | ✅ | ✅ | ✅ | ✅ |
| Créer événement | ❌ | ✅ | ✅ | ✅ |
| Créer annonce | ❌ | ✅ | ✅ | ✅ |
| Upload vidéo | ❌ | ❌ | ✅ | ✅ |
| Créer catégorie | ❌ | ❌ | ✅ | ✅ |
| Supprimer contenu | ❌ | ✅ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ |

---

## 📖 Guide d'Utilisation

### Exemples de Requêtes Prisma

#### 1. Créer un utilisateur
```typescript
const user = await prisma.users.create({
  data: {
    email: "john@church.com",
    name: "John Doe",
    password: hashedPassword, // À hasher avec bcrypt
    role: "USER"
  }
})
```

#### 2. Récupérer tous les événements à venir
```typescript
const upcomingEvents = await prisma.events.findMany({
  where: {
    eventDate: {
      gte: new Date() // Greater than or equal to now
    }
  },
  include: {
    user: true // Inclure l'organisateur
  },
  orderBy: {
    eventDate: 'asc'
  }
})
```

#### 3. Créer une vidéo avec catégorie
```typescript
const video = await prisma.videos.create({
  data: {
    title: "Le Pardon selon la Bible",
    description: "Étude sur le pardon",
    preacher: "Pasteur Martin",
    datePreached: new Date(),
    youtubeID: "dQw4w9WgXcQ",
    userId: 1,
    categoryId: 2 // "Enseignement biblique"
  }
})
```

#### 4. Récupérer les notifications non lues
```typescript
const unreadNotifications = await prisma.read_Notifications.findMany({
  where: {
    userId: currentUserId,
    read: false
  },
  include: {
    notification: true
  },
  orderBy: {
    dateRead: 'desc'
  }
})
```

#### 5. Marquer une notification comme lue
```typescript
await prisma.read_Notifications.update({
  where: {
    id: readNotificationId
  },
  data: {
    read: true,
    dateRead: new Date()
  }
})
```

#### 6. Récupérer toutes les vidéos d'une catégorie
```typescript
const videos = await prisma.videos.findMany({
  where: {
    categoryId: 1
  },
  include: {
    user: true,
    category: true
  },
  orderBy: {
    datePreached: 'desc'
  }
})
```

#### 7. Créer un témoignage
```typescript
const testimony = await prisma.testimonies.create({
  data: {
    title: "Dieu m'a guéri",
    content: "Mon témoignage de guérison miraculeuse...",
    userId: currentUserId
  }
})
```

#### 8. Envoyer une notification à tous les utilisateurs
```typescript
// 1. Créer la notification
const notification = await prisma.notifications.create({
  data: {
    title: "Nouveau culte ce dimanche",
    message: "Rejoignez-nous pour un culte spécial..."
  }
})

// 2. Créer les entrées Read_Notifications pour chaque utilisateur
const users = await prisma.users.findMany()

await prisma.read_Notifications.createMany({
  data: users.map(user => ({
    userId: user.id,
    notificationId: notification.id,
    read: false
  }))
})
```

---

## 🛠️ Commandes Prisma Utiles

### Initialisation
```bash
# Initialiser Prisma
npx prisma init

# Générer le client
npx prisma generate
```

### Migrations
```bash
# Créer une migration
npx prisma migrate dev --name init

# Appliquer les migrations en production
npx prisma migrate deploy

# Reset la base de données (DEV ONLY)
npx prisma migrate reset
```

### Outils
```bash
# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Formater le schema
npx prisma format

# Valider le schema
npx prisma validate
```

### Seed
```bash
# Créer des données de test
npx prisma db seed
```

---

## 📊 Statistiques du Schéma

- **Modèles totaux :** 8
- **Énumérations :** 1 (Role)
- **Relations :** 11
- **Suppressions en cascade :** 7
- **Contraintes uniques :** 2
- **Champs timestamp :** 16 (createdAt/updatedAt)

---

## ✅ Checklist de Validation

- [x] Énumération Role définie
- [x] Relations Many-to-One configurées
- [x] Suppression en cascade sur tous les contenus
- [x] Timestamps automatiques sur tous les modèles
- [x] Contraintes d'unicité appropriées
- [x] Table de jonction pour notifications
- [x] Catégories liées aux vidéos
- [x] Champs optionnels marqués avec `?`

---

## 🚀 Prochaines Étapes Recommandées

1. **Authentification**
   - Implémenter JWT ou NextAuth
   - Hash des mots de passe avec bcrypt

2. **Middleware de permissions**
   - Vérifier les rôles avant actions sensibles
   - Protéger les routes admin

3. **Validations**
   - Zod pour valider les inputs
   - Validation d'email format

4. **Optimisations**
   - Ajouter des index sur champs recherchés
   - Pagination pour les listes

5. **Fonctionnalités**
   - Upload de fichiers (images, vidéos)
   - Système de commentaires
   - Likes/Favoris

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---

**Version :** 1.0  
**Dernière mise à jour :** Décembre 2025  
**Auteur :** Maho-Nico