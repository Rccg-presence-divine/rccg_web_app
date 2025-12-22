import prisma from "@/lib/prisma";

export default async function UsersList() {
  const users = await prisma.users.findMany();

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
