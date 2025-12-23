"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { API_BASE_URL } from "../../../lib/config";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  auth: boolean;
  roles?: string[];
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  response: {
    status: number;
    description: string;
    example?: Record<string, unknown>;
  }[];
  examples?: { curl: string; javascript: string };
}

const endpoints: Endpoint[] = [
  // AUTH ENDPOINTS
  {
    method: "POST",
    path: "/api/auth/register",
    title: "Créer un compte",
    description: "Crée un nouveau compte utilisateur",
    auth: false,
    body: [
      {
        name: "email",
        type: "string",
        required: true,
        description: "Email unique de l'utilisateur",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Nom complet (min 2, max 100 caractères)",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description: "Mot de passe (min 6, max 100 caractères)",
      },
      {
        name: "verifyPassword",
        type: "string",
        required: true,
        description: "Confirmation du mot de passe",
      },
      {
        name: "phone",
        type: "string",
        required: false,
        description: "Numéro de téléphone",
      },
    ],
    response: [
      { status: 201, description: "Utilisateur créé avec succès" },
      { status: 400, description: "Email existe déjà ou données invalides" },
    ],
  },
  {
    method: "POST",
    path: "/api/auth/login",
    title: "Connexion",
    description:
      "Authentifie un utilisateur avec email/téléphone et mot de passe",
    auth: false,
    body: [
      {
        name: "email",
        type: "string",
        required: false,
        description: "Email de l'utilisateur",
      },
      {
        name: "phone",
        type: "string",
        required: false,
        description: "Téléphone de l'utilisateur",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description: "Mot de passe",
      },
    ],
    response: [
      {
        status: 200,
        description: "Connexion réussie",
        example: { message: "Connexion réussie", accessToken: "jwt_token" },
      },
      { status: 400, description: "Identifiant ou mot de passe incorrect" },
    ],
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    title: "Déconnexion",
    description: "Déconnecte l'utilisateur actuel",
    auth: true,
    response: [{ status: 200, description: "Déconnexion réussie" }],
  },
  {
    method: "POST",
    path: "/api/auth/refresh",
    title: "Rafraîchir le token",
    description: "Génère un nouveau token d'accès à partir du refresh token",
    auth: true,
    response: [
      { status: 200, description: "Token rafraîchi" },
      { status: 401, description: "Refresh token invalide ou expiré" },
    ],
  },
  {
    method: "POST",
    path: "/api/auth/forgot_password",
    title: "Réinitialiser le mot de passe",
    description: "Réinitialise le mot de passe d'un utilisateur",
    auth: false,
    body: [
      {
        name: "email",
        type: "string",
        required: true,
        description: "Email de l'utilisateur",
      },
      {
        name: "newPassword",
        type: "string",
        required: true,
        description: "Nouveau mot de passe (min 6, max 100)",
      },
    ],
    response: [
      { status: 200, description: "Mot de passe réinitialisé" },
      { status: 400, description: "Utilisateur non trouvé" },
    ],
  },

  // USERS ENDPOINTS
  {
    method: "GET",
    path: "/api/users/list",
    title: "Lister les utilisateurs",
    description: "Récupère la liste de tous les utilisateurs",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    response: [
      { status: 200, description: "Liste des utilisateurs récupérée" },
      { status: 403, description: "Accès refusé" },
    ],
  },
  {
    method: "POST",
    path: "/api/users/new",
    title: "Créer un utilisateur",
    description: "Crée un nouvel utilisateur (admin uniquement)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    body: [
      {
        name: "email",
        type: "string",
        required: true,
        description: "Email unique",
      },
      {
        name: "name",
        type: "string",
        required: true,
        description: "Nom complet",
      },
      {
        name: "password",
        type: "string",
        required: true,
        description: "Mot de passe",
      },
      {
        name: "phone",
        type: "string",
        required: false,
        description: "Téléphone",
      },
      {
        name: "role",
        type: "enum",
        required: false,
        description: "Rôle (USER, MODERATOR, PASTOR, SUPERADMIN)",
      },
    ],
    response: [
      { status: 201, description: "Utilisateur créé" },
      { status: 400, description: "Email existe déjà" },
    ],
  },
  {
    method: "PUT",
    path: "/api/users/[id]/update",
    title: "Mettre à jour un utilisateur",
    description: "Met à jour les informations d'un utilisateur (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'utilisateur",
      },
    ],
    body: [
      { name: "email", type: "string", required: false, description: "Email" },
      { name: "name", type: "string", required: false, description: "Nom" },
      {
        name: "phone",
        type: "string",
        required: false,
        description: "Téléphone",
      },
      { name: "role", type: "enum", required: false, description: "Rôle" },
    ],
    response: [
      { status: 200, description: "Utilisateur mis à jour" },
      { status: 404, description: "Utilisateur non trouvé" },
    ],
  },
  {
    method: "DELETE",
    path: "/api/users/[id]/delete",
    title: "Supprimer un utilisateur",
    description:
      "Supprime un utilisateur de la base de données (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'utilisateur à supprimer",
      },
    ],
    response: [
      { status: 200, description: "Utilisateur supprimé" },
      { status: 404, description: "Utilisateur non trouvé" },
    ],
  },

  // ANNOUNCEMENTS ENDPOINTS
  {
    method: "GET",
    path: "/api/announcements/list",
    title: "Lister les annonces",
    description: "Récupère toutes les annonces",
    auth: false,
    response: [{ status: 200, description: "Liste des annonces" }],
  },
  {
    method: "POST",
    path: "/api/announcements/new",
    title: "Créer une annonce",
    description: "Crée une nouvelle annonce (admin uniquement)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR", "MODERATOR"],
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Titre (min 5, max 100)",
      },
      {
        name: "content",
        type: "string",
        required: true,
        description: "Contenu (min 10, max 1000)",
      },
    ],
    response: [
      { status: 201, description: "Annonce créée" },
      { status: 400, description: "Données invalides" },
    ],
  },
  {
    method: "PUT",
    path: "/api/announcements/[id]/update",
    title: "Mettre à jour une annonce",
    description: "Met à jour une annonce existante (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR", "MODERATOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'annonce",
      },
    ],
    body: [
      { name: "title", type: "string", required: false, description: "Titre" },
      {
        name: "content",
        type: "string",
        required: false,
        description: "Contenu",
      },
    ],
    response: [
      { status: 200, description: "Annonce mise à jour" },
      { status: 404, description: "Annonce non trouvée" },
    ],
  },
  {
    method: "DELETE",
    path: "/api/announcements/[id]/delete",
    title: "Supprimer une annonce",
    description: "Supprime une annonce (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR", "MODERATOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'annonce",
      },
    ],
    response: [{ status: 200, description: "Annonce supprimée" }],
  },

  // CATEGORIES ENDPOINTS
  {
    method: "GET",
    path: "/api/categories/list",
    title: "Lister les catégories",
    description: "Récupère toutes les catégories",
    auth: true,
    response: [{ status: 200, description: "Liste des catégories" }],
  },
  {
    method: "POST",
    path: "/api/categories/new",
    title: "Créer une catégorie",
    description: "Crée une nouvelle catégorie",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Titre (min 5, max 100)",
      },
      {
        name: "description",
        type: "string",
        required: true,
        description: "Description (min 10)",
      },
    ],
    response: [{ status: 201, description: "Catégorie créée" }],
  },
  {
    method: "PUT",
    path: "/api/categories/[id]/update",
    title: "Mettre à jour une catégorie",
    description: "Met à jour une catégorie (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de la catégorie",
      },
    ],
    body: [
      { name: "title", type: "string", required: false, description: "Titre" },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Description",
      },
    ],
    response: [{ status: 200, description: "Catégorie mise à jour" }],
  },
  {
    method: "DELETE",
    path: "/api/categories/[id]/delete",
    title: "Supprimer une catégorie",
    description: "Supprime une catégorie (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de la catégorie",
      },
    ],
    response: [{ status: 200, description: "Catégorie supprimée" }],
  },

  // EVENTS ENDPOINTS
  {
    method: "GET",
    path: "/api/events/list",
    title: "Lister les événements",
    description: "Récupère tous les événements",
    auth: false,
    response: [{ status: 200, description: "Liste des événements" }],
  },
  {
    method: "POST",
    path: "/api/events/new",
    title: "Créer un événement",
    description: "Crée un nouvel événement",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Titre (min 5, max 100)",
      },
      {
        name: "description",
        type: "string",
        required: true,
        description: "Description (min 10)",
      },
      {
        name: "location",
        type: "string",
        required: true,
        description: "Lieu de l'événement",
      },
      {
        name: "eventDate",
        type: "date",
        required: true,
        description: "Date de l'événement (ISO format)",
      },
    ],
    response: [{ status: 201, description: "Événement créé" }],
  },
  {
    method: "PUT",
    path: "/api/events/[id]/update",
    title: "Mettre à jour un événement",
    description: "Met à jour un événement (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'événement",
      },
    ],
    body: [
      { name: "title", type: "string", required: false, description: "Titre" },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Description",
      },
      {
        name: "eventDate",
        type: "date",
        required: false,
        description: "Date de l'événement",
      },
    ],
    response: [{ status: 200, description: "Événement mis à jour" }],
  },
  {
    method: "DELETE",
    path: "/api/events/[id]/delete",
    title: "Supprimer un événement",
    description: "Supprime un événement (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de l'événement",
      },
    ],
    response: [{ status: 200, description: "Événement supprimé" }],
  },

  // TESTIMONIES ENDPOINTS
  {
    method: "GET",
    path: "/api/testimonies/list",
    title: "Lister les témoignages",
    description: "Récupère tous les témoignages",
    auth: false,
    response: [{ status: 200, description: "Liste des témoignages" }],
  },
  {
    method: "POST",
    path: "/api/testimonies/new",
    title: "Créer un témoignage",
    description: "Crée un nouveau témoignage",
    auth: true,
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Titre du témoignage",
      },
      {
        name: "content",
        type: "string",
        required: true,
        description: "Contenu du témoignage",
      },
    ],
    response: [{ status: 201, description: "Témoignage créé" }],
  },
  {
    method: "PUT",
    path: "/api/testimonies/[id]/update",
    title: "Mettre à jour un témoignage",
    description: "Met à jour un témoignage (ID dans l'URL)",
    auth: true,
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID du témoignage",
      },
    ],
    body: [
      { name: "title", type: "string", required: false, description: "Titre" },
      {
        name: "content",
        type: "string",
        required: false,
        description: "Contenu",
      },
    ],
    response: [{ status: 200, description: "Témoignage mis à jour" }],
  },
  {
    method: "DELETE",
    path: "/api/testimonies/[id]/delete",
    title: "Supprimer un témoignage",
    description: "Supprime un témoignage (ID dans l'URL)",
    auth: true,
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID du témoignage",
      },
    ],
    response: [{ status: 200, description: "Témoignage supprimé" }],
  },

  // MEDIAS ENDPOINTS
  {
    method: "GET",
    path: "/api/medias/list",
    title: "Lister les médias",
    description: "Récupère tous les fichiers médias",
    auth: false,
    response: [{ status: 200, description: "Liste des médias" }],
  },
  {
    method: "POST",
    path: "/api/medias/new",
    title: "Uploader un média",
    description: "Uploader un fichier média",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR", "MODERATOR"],
    body: [
      {
        name: "filename",
        type: "string",
        required: true,
        description: "Nom du fichier",
      },
      {
        name: "url",
        type: "string",
        required: true,
        description: "URL du fichier",
      },
      {
        name: "mediaType",
        type: "string",
        required: true,
        description: "Type de média (image, video, audio)",
      },
    ],
    response: [{ status: 201, description: "Média uploadé" }],
  },
  {
    method: "DELETE",
    path: "/api/medias/[id]/delete",
    title: "Supprimer un média",
    description: "Supprime un fichier média (ID dans l'URL)",
    auth: true,
    roles: ["SUPERADMIN", "PASTOR", "MODERATOR"],
    params: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID du média",
      },
    ],
    response: [{ status: 200, description: "Média supprimé" }],
  },

  // NOTIFICATIONS ENDPOINTS
  {
    method: "GET",
    path: "/api/notifications",
    title: "Lister les notifications",
    description: "Récupère toutes les notifications",
    auth: true,
    response: [{ status: 200, description: "Liste des notifications" }],
  },
  {
    method: "GET",
    path: "/api/read_notification/read",
    title: "Liste des notifications lues",
    description: "Récupère les notifications marquées comme lues",
    auth: true,
    response: [{ status: 200, description: "Liste des notifications lues" }],
  },
  {
    method: "GET",
    path: "/api/read_notification/unread",
    title: "Liste des notifications non lues",
    description: "Récupère les notifications non lues",
    auth: true,
    response: [
      { status: 200, description: "Liste des notifications non lues" },
    ],
  },
  {
    method: "PUT",
    path: "/api/read_notification",
    title: "Marquer comme lue",
    description:
      "Marque une notification comme lue (passer { id } dans le corps)",
    auth: true,
    body: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de la notification",
      },
    ],
    response: [{ status: 200, description: "Notification marquée comme lue" }],
  },
  {
    method: "DELETE",
    path: "/api/read_notification",
    title: "Supprimer une notification",
    description: "Supprime une notification (passer { id } dans le corps)",
    auth: true,
    body: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "ID de la notification",
      },
    ],
    response: [{ status: 200, description: "Notification supprimée" }],
  },
];

export default function APIDocPage() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(
    new Set()
  );
  const [copiedCode, setCopiedCode] = useState<string>("");

  const toggleEndpoint = (path: string) => {
    const newSet = new Set(expandedEndpoints);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedEndpoints(newSet);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-700",
      POST: "bg-green-100 text-green-700",
      PUT: "bg-yellow-100 text-yellow-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return colors[method as keyof typeof colors] || "bg-gray-100";
  };

  const getFullUrl = (path: string) =>
    `${API_BASE_URL}${path.startsWith("/api/") ? `/v1${path.slice(4)}` : path}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Documentation API RCCG
          </h1>
          <p className="text-lg text-slate-600">
            Référence complète des endpoints disponibles
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>URL de base:</strong>{" "}
              <code className="bg-white px-2 py-1 rounded">
                {API_BASE_URL + "/api/v1"}
              </code>
            </p>
            <p className="text-sm text-slate-700 mt-2">
              <strong>Authentification:</strong> Bearer token (JWT) requis pour
              certains endpoints
            </p>
          </div>
        </div>

        {/* Authentication Info */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            🔐 Authentification
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Headers requis:
              </h3>
              <div className="bg-slate-50 p-3 rounded font-mono text-sm text-gray-500">
                Authorization: Bearer &lt;accessToken&gt;
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">
                Rôles disponibles:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center text-gray-400">
                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2 text-gray-500"></span>
                  SUPERADMIN
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 text-gray-500"></span>
                  PASTOR
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 text-gray-500"></span>
                  MODERATOR
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 text-gray-500"></span>
                  USER
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Codes */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            📊 Codes de réponse HTTP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                200
              </span>
              <span className="text-slate-600">Succès (GET, PUT, DELETE)</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                201
              </span>
              <span className="text-slate-600">Créé (POST)</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                400
              </span>
              <span className="text-slate-600">Requête invalide</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                401
              </span>
              <span className="text-slate-600">Non authentifié</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                403
              </span>
              <span className="text-slate-600">Accès refusé</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded font-semibold text-sm mr-3">
                500
              </span>
              <span className="text-slate-600">Erreur serveur</span>
            </div>
          </div>
        </div>

        {/* Endpoints by Category */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            📚 Endpoints
          </h2>

          {/* Group endpoints by category */}
          {[
            "Authentication",
            "Users",
            "Announcements",
            "Categories",
            "Events",
            "Testimonies",
            "Medias",
            "Notifications",
          ].map((category) => {
            const categoryEndpoints = endpoints.filter((ep) => {
              if (category === "Authentication")
                return ep.path.includes("/auth/");
              if (category === "Users") return ep.path.includes("/api/users");
              if (category === "Announcements")
                return ep.path.includes("/api/announcements");
              if (category === "Categories")
                return ep.path.includes("/api/categories");
              if (category === "Events") return ep.path.includes("/api/events");
              if (category === "Testimonies")
                return ep.path.includes("/api/testimonies");
              if (category === "Medias") return ep.path.includes("/api/medias");
              if (category === "Notifications")
                return ep.path.includes("/notification");
              return false;
            });

            return (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 px-4 py-2 bg-slate-200 rounded">
                  {category}
                </h3>
                <div className="space-y-3">
                  {categoryEndpoints.map((endpoint, idx) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}-${idx}`}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
                    >
                      {/* Header - Click to expand */}
                      <button
                        onClick={() =>
                          toggleEndpoint(`${endpoint.method}-${endpoint.path}`)
                        }
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1 text-left">
                          <span
                            className={`px-3 py-1 rounded font-bold text-sm ${getMethodColor(
                              endpoint.method
                            )}`}
                          >
                            {endpoint.method}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {endpoint.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {endpoint.path}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-slate-400 transition-transform ${
                            expandedEndpoints.has(
                              `${endpoint.method}-${endpoint.path}`
                            )
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {/* Expanded Content */}
                      {expandedEndpoints.has(
                        `${endpoint.method}-${endpoint.path}`
                      ) && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-4">
                          {/* Description */}
                          <div>
                            <p className="text-slate-700">
                              {endpoint.description}
                            </p>
                          </div>

                          {/* Auth Info */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">
                              🔒 Authentification:
                            </span>
                            <span
                              className={`text-sm px-2 py-1 rounded ${
                                endpoint.auth
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {endpoint.auth ? "Requise" : "Optionnelle"}
                            </span>
                            {endpoint.roles && (
                              <span className="text-sm text-slate-600 ml-2">
                                Rôles:{" "}
                                <span className="font-mono">
                                  {endpoint.roles.join(", ")}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Request Body */}
                          {endpoint.body && endpoint.body.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-3">
                                📥 Corps de la requête:
                              </h4>
                              <div className="bg-white rounded border border-slate-300 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Paramètre
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Type
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Requis
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Description
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {endpoint.body.map((param, pidx) => (
                                      <tr
                                        key={pidx}
                                        className="border-t border-slate-200"
                                      >
                                        <td className="px-4 py-2 font-mono text-slate-900">
                                          {param.name}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">
                                          {param.type}
                                        </td>
                                        <td className="px-4 py-2">
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${
                                              param.required
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {param.required ? "Oui" : "Non"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">
                                          {param.description}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Query Parameters */}
                          {endpoint.params && endpoint.params.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-900 mb-3">
                                🔍 Paramètres de requête:
                              </h4>
                              <div className="bg-white rounded border border-slate-300 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Paramètre
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Type
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Requis
                                      </th>
                                      <th className="px-4 py-2 text-left font-semibold">
                                        Description
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {endpoint.params.map((param, pidx) => (
                                      <tr
                                        key={pidx}
                                        className="border-t border-slate-200"
                                      >
                                        <td className="px-4 py-2 font-mono text-slate-900">
                                          {param.name}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">
                                          {param.type}
                                        </td>
                                        <td className="px-4 py-2">
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${
                                              param.required
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {param.required ? "Oui" : "Non"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">
                                          {param.description}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Responses */}
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-3">
                              📤 Réponses:
                            </h4>
                            <div className="space-y-2">
                              {endpoint.response.map((resp, ridx) => (
                                <div
                                  key={ridx}
                                  className="bg-white rounded border border-slate-300 p-3"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-bold text-white ${
                                        resp.status >= 200 && resp.status < 300
                                          ? "bg-green-500"
                                          : resp.status >= 400 &&
                                            resp.status < 500
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                    >
                                      {resp.status}
                                    </span>
                                    <span className="text-slate-700">
                                      {resp.description}
                                    </span>
                                  </div>
                                  {resp.example && (
                                    <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-800 overflow-auto max-h-32">
                                      {JSON.stringify(resp.example, null, 2)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Code Examples */}
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-3">
                              💻 Exemples:
                            </h4>
                            <div className="space-y-3">
                              {/* cURL Example */}
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">
                                  cURL:
                                </p>
                                <div className="bg-slate-900 rounded relative">
                                  <button
                                    onClick={() => {
                                      const curl = `curl -X ${
                                        endpoint.method
                                      } ${getFullUrl(endpoint.path)} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"${
    endpoint.body && endpoint.body.length > 0
      ? ` \\
  -d '${JSON.stringify(
    endpoint.body.reduce((acc, b) => ({ ...acc, [b.name]: "value" }), {}),
    null,
    2
  )}'`
      : ""
  }`;
                                      copyToClipboard(
                                        curl,
                                        `curl-${endpoint.method}-${endpoint.path}`
                                      );
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                                  >
                                    {copiedCode ===
                                    `curl-${endpoint.method}-${endpoint.path}` ? (
                                      <Check
                                        size={16}
                                        className="text-green-400"
                                      />
                                    ) : (
                                      <Copy
                                        size={16}
                                        className="text-slate-300"
                                      />
                                    )}
                                  </button>
                                  <pre className="p-4 text-xs text-slate-100 overflow-auto max-h-40">
                                    {`curl -X ${endpoint.method} ${getFullUrl(
                                      endpoint.path
                                    )} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"${
    endpoint.body && endpoint.body.length > 0
      ? ` \\
  -d '${JSON.stringify(
    endpoint.body.reduce((acc, b) => ({ ...acc, [b.name]: "value" }), {}),
    null,
    2
  )}'`
      : ""
  }`}
                                  </pre>
                                </div>
                              </div>

                              {/* JavaScript Example */}
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">
                                  JavaScript/TypeScript:
                                </p>
                                <div className="bg-slate-900 rounded relative">
                                  <button
                                    onClick={() => {
                                      const jsExample = `const response = await fetch('${getFullUrl(
                                        endpoint.path
                                      )}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },${
    endpoint.body && endpoint.body.length > 0
      ? `
  body: JSON.stringify({
    ${endpoint.body.map((b) => `${b.name}: 'value'`).join(",\n    ")}
  }),`
      : ""
  }
});

const data = await response.json();`;
                                      copyToClipboard(
                                        jsExample,
                                        `js-${endpoint.method}-${endpoint.path}`
                                      );
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                                  >
                                    {copiedCode ===
                                    `js-${endpoint.method}-${endpoint.path}` ? (
                                      <Check
                                        size={16}
                                        className="text-green-400"
                                      />
                                    ) : (
                                      <Copy
                                        size={16}
                                        className="text-slate-300"
                                      />
                                    )}
                                  </button>
                                  <pre className="p-4 text-xs text-slate-100 overflow-auto max-h-40">
                                    {`const response = await fetch('${getFullUrl(
                                      endpoint.path
                                    )}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },${
    endpoint.body && endpoint.body.length > 0
      ? `
  body: JSON.stringify({
    ${endpoint.body.map((b) => `${b.name}: 'value'`).join(",\n    ")}
  }),`
      : ""
  }
});

const data = await response.json();`}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            📖 Notes importantes
          </h3>
          <ul className="space-y-2 text-slate-700">
            <li>✅ Tous les endpoints retournent une réponse JSON</li>
            <li>
              ✅ Les erreurs incluent un message descriptif et optionnellement
              des détails
            </li>
            <li>✅ Les tokens d&apos;accès ont une durée de vie limitée</li>
            <li>
              ✅ Les refresh tokens sont stockés dans les cookies HTTP-only
            </li>
            <li>
              ✅ La validation des données est effectuée côté serveur avec Zod
            </li>
            <li>✅ Les mots de passe sont hashés avec Argon2</li>
            <li>✅ L&apos;authentification utilise JWT (JSON Web Tokens)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
