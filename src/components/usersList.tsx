"use client";

import { useEffect, useState } from "react";

type User = { id: string; name: string | null; email?: string };

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? res.statusText);
        }
        const data = await res.json();
        // the API returns { message, usersWithoutPasswords }
        setUsers(data.usersWithoutPasswords ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Chargement des utilisateurs…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!users.length) return <p>Aucun utilisateur trouvé.</p>;

  return (
    <ol className="list-decimal list-inside font-[family-name:var(--font-geist-sans)]">
      {users.map((user) => (
        <li key={user.id} className="mb-2 text-[#555555]">
          {user.name}
        </li>
      ))}
    </ol>
  );
}
