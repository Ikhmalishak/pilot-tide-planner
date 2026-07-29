import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const hourlyLevelRepository = {
  async findByDate(date: string) {
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${date}T23:59:59Z`);
    return prisma.hourlyTideLevel.findMany({
      where: { recordedAt: { gte: start, lte: end } },
      orderBy: { recordedAt: 'asc' },
    });
  },

  async create(data: { recordedAt: Date; waterLevelFt: number; source?: string }) {
    return prisma.hourlyTideLevel.create({ data: data as any });
  },

  async createMany(data: { recordedAt: Date; waterLevelFt: number; source?: string }[]) {
    return prisma.hourlyTideLevel.createMany({ data: data as any });
  },

  async update(id: string, data: { waterLevelFt?: number; recordedAt?: Date }) {
    return prisma.hourlyTideLevel.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.hourlyTideLevel.delete({ where: { id } });
  },
};
