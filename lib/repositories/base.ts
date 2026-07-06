import prisma from "../prisma";

export class Repository {
  static user = {
    findById: (id: string) => prisma.user.findUnique({ where: { id } }),
    findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
    findAll: (params?: Parameters<typeof prisma.user.findMany>[0]) =>
      prisma.user.findMany(params),
    create: (data: Parameters<typeof prisma.user.create>[0]["data"]) =>
      prisma.user.create({ data }),
    update: (id: string, data: Parameters<typeof prisma.user.update>[0]["data"]) =>
      prisma.user.update({ where: { id }, data }),
    delete: (id: string) => prisma.user.delete({ where: { id } }),
    count: (where?: Record<string, unknown>) =>
      prisma.user.count({ where } as never),
  };

  static note = {
    findById: (id: string) => prisma.note.findUnique({ where: { id } }),
    findByUserId: (userId: string) =>
      prisma.note.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    findAll: (params?: Parameters<typeof prisma.note.findMany>[0]) =>
      prisma.note.findMany(params),
    create: (data: Parameters<typeof prisma.note.create>[0]["data"]) =>
      prisma.note.create({ data }),
    update: (id: string, data: Parameters<typeof prisma.note.update>[0]["data"]) =>
      prisma.note.update({ where: { id }, data }),
    delete: (id: string) => prisma.note.delete({ where: { id } }),
  };

  static share = {
    findByToken: (token: string) => prisma.share.findUnique({ where: { token } }),
    findById: (id: string) => prisma.share.findUnique({ where: { id } }),
    findByNoteId: (noteId: string) =>
      prisma.share.findMany({
        where: { noteId },
        orderBy: { createdAt: "desc" },
      }),
    findActiveByNoteId: (noteId: string) =>
      prisma.share.findMany({
        where: {
          noteId,
          isRevoked: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    findAll: (params?: Parameters<typeof prisma.share.findMany>[0]) =>
      prisma.share.findMany(params),
    create: (data: Parameters<typeof prisma.share.create>[0]["data"]) =>
      prisma.share.create({ data }),
    update: (id: string, data: Parameters<typeof prisma.share.update>[0]["data"]) =>
      prisma.share.update({ where: { id }, data }),
    delete: (id: string,) => prisma.share.delete({ where: { id } }),
  };
}
