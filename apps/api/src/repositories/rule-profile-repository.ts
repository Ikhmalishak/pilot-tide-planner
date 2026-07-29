import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ruleProfileRepository = {
  async findAll() {
    return prisma.ruleProfile.findMany({ orderBy: { name: 'asc' } });
  },

  async findActive() {
    return prisma.ruleProfile.findFirst({ where: { active: true } });
  },

  async findById(id: string) {
    return prisma.ruleProfile.findUnique({ where: { id } });
  },

  async update(id: string, data: {
    name?: string;
    redDifference?: number;
    yellowDifference?: number;
    greenDifference?: number;
    yellowDisabledStart?: Date;
    yellowDisabledEnd?: Date;
    active?: boolean;
  }) {
    return prisma.ruleProfile.update({ where: { id }, data });
  },
};
