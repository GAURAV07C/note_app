// Repository pattern base class
// Saare database operations ke liye reusable methods provide karta hai
import prisma from "../prisma";

export class Repository {
  // User related database operations
  static user = {
    // User ID se find karta hai
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    // Email se user find karta hai
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    // Saare users fetch karta hai with optional filters
    findAll: (params?: Parameters<typeof prisma.user.findMany>[0]) =>
      prisma.user.findMany(params),
    // Naya user create karta hai
    create: (data: Parameters<typeof prisma.user.create>[0]["data"]) =>
      prisma.user.create({ data }),
    // Existing user update karta hai
    update: (id: string, data: Parameters<typeof prisma.user.update>[0]["data"]) =>
      prisma.user.update({ where: { id }, data }),
    // User delete karta hai
    delete: (id: string) => prisma.user.delete({ where: { id } }),
    // User count karta hai with optional filter
    count: (where?: Record<string, unknown>) =>
      prisma.user.count({ where } as never),
  };

  // Note related database operations
  static note = {
    // Note ID se find karta hai
    findById: (id: string) => prisma.note.findUnique({ where: { id } }),
    // Specific user ke saare notes fetch karta hai with shares
    findByUserId: (userId: string) =>
      prisma.note.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { shares: true },
      }),
    // Saare notes fetch karta hai with optional filters
    findAll: (params?: Parameters<typeof prisma.note.findMany>[0]) =>
      prisma.note.findMany(params),
    // Naya note create karta hai
    create: (data: Parameters<typeof prisma.note.create>[0]["data"]) =>
      prisma.note.create({ data }),
    // Note update karta hai
    update: (id: string, data: Parameters<typeof prisma.note.update>[0]["data"]) =>
      prisma.note.update({ where: { id }, data }),
    // Note delete karta hai
    delete: async (id: string) => {
      await prisma.share.deleteMany({ where: { noteId: id } });
      return prisma.note.delete({ where: { id } });
    },
  };

  // Share related database operations
  static share = {
    // Token se share link find karta hai
    findByToken: (token: string) => prisma.share.findUnique({ where: { token } }),
    // Share ID se find karta hai
    findById: (id: string) => prisma.share.findUnique({ where: { id } }),
    // Specific note ke saare shares fetch karta hai
    findByNoteId: (noteId: string) =>
      prisma.share.findMany({
        where: { noteId },
        orderBy: { createdAt: "desc" },
      }),
    // Note ke active shares fetch karta hai (not revoked, not used, not expired)
    findActiveByNoteId: (noteId: string) =>
      prisma.share.findMany({
        where: {
          noteId,
          isRevoked: false,
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    // Saare shares fetch karta hai with optional filters
    findAll: (params?: Parameters<typeof prisma.share.findMany>[0]) =>
      prisma.share.findMany(params),
    // Naya share create karta hai
    create: (data: Parameters<typeof prisma.share.create>[0]["data"]) =>
      prisma.share.create({ data }),
    // Share update karta hai
    update: (id: string, data: Parameters<typeof prisma.share.update>[0]["data"]) =>
      prisma.share.update({ where: { id }, data }),
    // Share delete karta hai
    delete: (id: string,) => prisma.share.delete({ where: { id } }),
  };
}
