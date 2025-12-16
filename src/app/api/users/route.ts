import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Utility: hash and verify using scrypt (no extra deps)
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

// function verifyPassword(stored: string, supplied: string) {
//   const [salt, key] = String(stored).split(":");
//   if (!salt || !key) return false;
//   const derived = scryptSync(supplied, salt, 64).toString("hex");
//   try {
//     return timingSafeEqual(
//       Buffer.from(derived, "hex"),
//       Buffer.from(key, "hex")
//     );
//   } catch (e) {
//     return false;
//   }
// }

// Lire

export async function GET() {
  try {
    const users = await prisma.users.findMany();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des utilisateurs.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Ecrire
export async function POST(req: Request) {
  try {
    const request = await req.json();
    // validation du champs email
    if (!request?.email) {
      return NextResponse.json(
        { error: "L'email est requis." },
        { status: 400 }
      );
    }
    // vérification de l'unicité de l'email
    if (request?.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email: request.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà." },
          { status: 400 }
        );
      }
    }
    // validation du champs password
    if (!request?.password) {
      return NextResponse.json(
        { error: "Le mot de passe est requis." },
        { status: 400 }
      );
    }
    // Validation du rôle si fourni
    const validRoles = ["SUPERADMIN", "PASTOR", "MODERATOR", "USER"];
    if (request.role && !validRoles.includes(request.role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Utilisez: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }
    const hashedPassword = hashPassword(String(request.password));

    const newUser = await prisma.users.create({
      data: {
        name: request.name ?? null,
        email: request.email,
        password: hashedPassword,
        phone: request.phone ?? null,
        role: request.role ?? "USER",
      },
    });

    // Ne pas retourner le mot de passe hashé
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error", error);

    // Meilleur logging pour identifier le problème
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Mettre à jour
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    // validation de l'ID utilisateur
    if (!request?.id) {
      return NextResponse.json(
        { error: "L'identifiant de l'utilisateur est requis." },
        { status: 400 }
      );
    }
    // vérifier si l'utilisateur existe
    const existingUser = await prisma.users.findUnique({
      where: { id: request.id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }
    // hacher le mot de passe si fourni
    const passwordToUpdate = hashPassword(String(request?.password));

    const updatedUser = await prisma.users.update({
      where: { id: request.id },
      data: {
        name: request.name ?? existingUser.name,
        email: request.email ?? existingUser.email,
        phone: request.phone ?? existingUser.phone,
        role: request.role ?? existingUser.role,
        password: passwordToUpdate ?? existingUser.password,
        updatedAt: new Date(),
      },
    });
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Supprimer
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // validation de l'ID utilisateur
    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de l'utilisateur est requis." },
        { status: 400 }
      );
    }
    // vérifier si l'utilisateur existe
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }
    // supprimer l'utilisateur
    await prisma.users.delete({
      where: { id },
    });
    return NextResponse.json(
      { message: "Utilisateur supprimé avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
