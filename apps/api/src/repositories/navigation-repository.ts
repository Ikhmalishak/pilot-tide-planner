import { prisma } from '../utils/prisma';

export const navigationRepository = {
  async findByDate(date: string) {
    const navDate = new Date(`${date}T00:00:00Z`);
    return prisma.navigationWindow.findFirst({
      where: { navigationDate: navDate },
      orderBy: { generatedAt: 'desc' },
      include: { items: { orderBy: { hour: 'asc' } } },
    });
  },

  async findWithPagination(params: { page?: number; limit?: number; from?: string; to?: string }) {
    const { page = 1, limit = 20, from, to } = params;
    const where: any = {};
    if (from || to) {
      where.navigationDate = {};
      if (from) where.navigationDate.gte = new Date(`${from}T00:00:00Z`);
      if (to) where.navigationDate.lte = new Date(`${to}T23:59:59Z`);
    }
    const [data, total] = await Promise.all([
      prisma.navigationWindow.findMany({
        where,
        include: { items: { orderBy: { hour: 'asc' } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { navigationDate: 'desc' },
      }),
      prisma.navigationWindow.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async deleteByDate(date: string) {
    const navDate = new Date(`${date}T00:00:00Z`);
    const existing = await prisma.navigationWindow.findMany({ where: { navigationDate: navDate } });
    for (const w of existing) {
      await prisma.navigationWindowItem.deleteMany({ where: { windowId: w.id } });
      await prisma.navigationWindow.delete({ where: { id: w.id } });
    }
  },

  async create(data: {
    navigationDate: Date;
    profileId: string;
    status: string;
    items: { hour: Date; waterLevelFt: number; isRed: boolean; isYellow: boolean; isGreen: boolean }[];
  }) {
    return prisma.navigationWindow.create({
      data: {
        navigationDate: data.navigationDate,
        profileId: data.profileId,
        status: data.status as any,
        items: {
          create: data.items.map((item) => ({
            hour: item.hour,
            waterLevelFt: item.waterLevelFt,
            isRed: item.isRed,
            isYellow: item.isYellow,
            isGreen: item.isGreen,
          })),
        },
      },
      include: { items: { orderBy: { hour: 'asc' } } },
    });
  },
};
