// prisma/seed.ts
import * as dotenv from "dotenv";
dotenv.config(); // ← charge le .env en premier

import prisma from "../src/lib/prisma"; // ← ton fichier existant
import { faker } from "@faker-js/faker";
import * as argon2 from "argon2";

async function main() {
    console.log("🌱 Début du seeding...");

    // // Nettoyer la base de données dans le bon ordre (relations)
    // await prisma.medias.deleteMany();
    // await prisma.categories.deleteMany();
    // await prisma.announcements.deleteMany();
    // await prisma.events.deleteMany();
    // await prisma.testimonies.deleteMany();
    // await prisma.image.deleteMany();
    // await prisma.users.deleteMany();

    // ========================
    // 1. Créer les Utilisateurs
    // ========================
    const hashedPassword = await argon2.hash("Password123");

    const users = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
            prisma.users.create({
                data: {
                    email: i === 0 ? "admin@church.com" : faker.internet.email(),
                    name: faker.person.fullName(),
                    password: hashedPassword,
                    phone: faker.phone.number({ style: "international" }),
                    role: i === 0 ? "SUPERADMIN" : i === 1 ? "PASTOR" : i === 2 ? "MODERATOR" : "USER",
                },
            })
        )
    );

    console.log(`✅ ${users.length} utilisateurs créés`);

    // ========================
    // 2. Créer les Testimonies
    // ========================
    const testimonies = await Promise.all(
        Array.from({ length: 15 }).map(() =>
            prisma.testimonies.create({
                data: {
                    title: faker.lorem.sentence({ min: 3, max: 7 }),
                    content: faker.lorem.paragraphs(2),
                    approved: faker.datatype.boolean(),
                    userId: faker.helpers.arrayElement(users).id,
                },
            })
        )
    );

    console.log(`✅ ${testimonies.length} témoignages créés`);

    // ========================
    // 3. Créer les Events
    // ========================
    const events = await Promise.all(
        Array.from({ length: 8 }).map(() =>
            prisma.events.create({
                data: {
                    title: faker.lorem.words({ min: 3, max: 6 }),
                    description: faker.lorem.paragraph(),
                    eventDate: faker.date.future(),
                    location: faker.location.city() + ", " + faker.location.country(),
                    userId: faker.helpers.arrayElement(users).id,
                },
            })
        )
    );

    console.log(`✅ ${events.length} événements créés`);

    // ========================
    // 4. Créer les Announcements
    // ========================
    const announcements = await Promise.all(
        Array.from({ length: 10 }).map(() =>
            prisma.announcements.create({
                data: {
                    title: faker.lorem.sentence({ min: 3, max: 6 }),
                    content: faker.lorem.paragraphs(1),
                    recurrent: faker.datatype.boolean(),
                    userId: faker.helpers.arrayElement(users).id,
                },
            })
        )
    );

    console.log(`✅ ${announcements.length} annonces créées`);

    // ========================
    // 5. Créer les Categories
    // ========================
    const categoryTitles = [
        "Prédication",
        "Louange & Adoration",
        "Enseignement Biblique",
        "Jeunesse",
        "Évangélisation",
        "Prière",
        "Famille",
        "Témoignages",
    ];

    const categories = await Promise.all(
        categoryTitles.map((title) =>
            prisma.categories.create({
                data: {
                    title,
                    description: faker.lorem.sentence(),
                    userId: faker.helpers.arrayElement(users).id,
                },
            })
        )
    );

    console.log(`✅ ${categories.length} catégories créées`);

    // ========================
    // 6. Créer les Medias
    // ========================
    const preachers = users
        .filter((u) => u.role === "PASTOR" || u.role === "SUPERADMIN")
        .map((u) => u.name ?? "Pasteur inconnu");

    const medias = await Promise.all(
        Array.from({ length: 20 }).map(() => {
            const isVideo = faker.datatype.boolean();
            return prisma.medias.create({
                data: {
                    title: faker.lorem.words({ min: 4, max: 8 }),
                    description: faker.lorem.sentence(),
                    preacher: faker.helpers.arrayElement(preachers),
                    datePreached: faker.date.past(),
                    isVideo,
                    youtubeID: isVideo ? faker.string.alphanumeric(11) : null,
                    mediaUrl: isVideo ? null : faker.internet.url(),
                    thumbnailUrl: faker.image.url(),
                    featured: faker.datatype.boolean(),
                    userId: faker.helpers.arrayElement(users).id,
                    categoryId: faker.helpers.arrayElement(categories).id,
                },
            });
        })
    );

    console.log(`✅ ${medias.length} médias créés`);

    console.log("\n🎉 Seeding terminé avec succès !");
    console.log("📧 Compte admin : admin@church.com");
    console.log("🔑 Mot de passe : password123");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seeding :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });