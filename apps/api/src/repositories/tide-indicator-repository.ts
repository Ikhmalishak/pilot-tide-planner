import { prisma } from '../utils/prisma';

export const tideIndicatorRepository = {
  async findByDate(date: string) {
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${date}T23:59:59Z`);
    return prisma.tideIndicator.findMany({
      where: { occurredAt: { gte: start, lte: end } },
      orderBy: { occurredAt: 'asc' },
    });
  },

  async findAll() {
    return prisma.tideIndicator.findMany({ orderBy: { occurredAt: 'asc' } });
  },

  async create(data: { occurredAt: Date; type: string; waterLevelFt: number; source?: string }) {
    return prisma.tideIndicator.create({ data: data as any });
  },

  async createMany(data: { occurredAt: Date; type: string; waterLevelFt: number; source?: string }[]) {
    return prisma.tideIndicator.createMany({ data: data as any });
  },

  async update(id: string, data: { waterLevelFt?: number; type?: string; occurredAt?: Date }) {
    return prisma.tideIndicator.update({ where: { id }, data: data as any });
  },

  async delete(id: string) {
    return prisma.tideIndicator.delete({ where: { id } });
  },
};
