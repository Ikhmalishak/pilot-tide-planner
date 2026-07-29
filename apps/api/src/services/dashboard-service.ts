import { tideIndicatorRepository } from '../repositories/tide-indicator-repository';
import { navigationRepository } from '../repositories/navigation-repository';
import type { NavigationColor } from '@pilot-tide-planner/shared-types';

export const dashboardService = {
  async getDashboard(date: string) {
    const indicators = await tideIndicatorRepository.findByDate(date);
    const navigationWindow = await navigationRepository.findByDate(date);

    return {
      date,
      tideIndicators: indicators.map((i) => ({
        type: i.type,
        time: i.occurredAt.toISOString(),
        level: Number(i.waterLevelFt),
      })),
      navigationWindow: navigationWindow
        ? {
            generated: true,
            items: navigationWindow.items.map((item) => {
              const status: NavigationColor[] = [];
              if (item.isRed) status.push('RED');
              if (item.isYellow) status.push('YELLOW');
              if (item.isGreen) status.push('GREEN');
              return {
                hour: item.hour.toISOString(),
                waterLevelFt: Number(item.waterLevelFt),
                status,
              };
            }),
          }
        : null,
    };
  },
};
