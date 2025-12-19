import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createUserSchema, updateUserSchema } from "@/validators/users.schema";
import * as argon2 from "argon2";
// Utility: hash and verify using scrypt (no extra deps)
import { requireRole, requireAnyRole, requireAuth } from "@/lib/auth";

// Lire

export async function GET() {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR"]);
    const users = await prisma.users.findMany();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(
      { message: "Utilisateurs chargés.", usersWithoutPasswords },
      { status: 200 }
    );
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
    await requireAnyRole(["SUPERADMIN", "PASTOR"]);

    // Récupération des données de la requête
    const body = await req.json();

    // Validation avec Zod
    const parseResult = createUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données utilisateur invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Vérification de l'unicité de l'email
    const existingUser = await prisma.users.findUnique({
      where: { email: parseResult.data.email },
    });
    // Si l'utilisateur existe déjà, retourner une erreur
    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 400 }
      );
    }

    // Extraction des données validées
    const { password, ...userData } = parseResult.data;

    // hachage du mot de passe et création de l'utilisateur
    const hashedPassword = await argon2.hash(password);

    // Création de l'utilisateur dans la base de données
    const newUser = await prisma.users.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Utilisateur créé avec succès.", userData },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Vous n'avez pas le droit necessaire." },
      { status: 401 }
    );
  }
}

// Mettre à jour
export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth();

    // Récupération des données de la requête
    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données utilisateur invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Vérification de l'existence de l'utilisateur
    const existingUser = await prisma.users.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }
    // Vérifier si l'utilisateur est l'auteur de son propre compte
    if (existingUser.id !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que votre propre compte." },
        { status: 403 }
      );
    }
    // Hasher le mot de passe si fourni
    if (parseResult.data.password) {
      parseResult.data.password = await argon2.hash(parseResult.data.password);
    }

    // Récupération des données ecepté le id de l'utilisateur
    const { id, name, email, phone, role, password } = parseResult.data;
    // Mise à jour de l'utilisateur dans la base de données
    const updatedUser = await prisma.users.update({
      where: { id: id },
      data: {
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        phone: phone ?? existingUser.phone,
        role: role ?? existingUser.role,
        password: password ?? existingUser.password,
      },
    });

    // retirer l'id et le mot de passe avant de renvoyer la réponse
    const { id: _, password: __, ...userPublic } = updatedUser;

    return NextResponse.json(
      { message: "Utilisateur modifié avec succès.", userPublic },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
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
