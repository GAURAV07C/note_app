// Prisma client singleton
// Database ke saath interact karne ke liye Prisma client instance banata hai
import { PrismaClient } from "@prisma/client";

// Prisma client ka ek hi instance banakar export kar rahe hai
const prisma = new PrismaClient();

export default prisma;
