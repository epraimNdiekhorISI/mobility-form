import { PrismaClient } from "@prisma/client";

// Instance unique du client Prisma pour toute l'application.
export const prisma = new PrismaClient();
