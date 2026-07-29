import { tideIndicatorRepository } from '../repositories/tide-indicator-repository';
import { hourlyLevelRepository } from '../repositories/hourly-level-repository';
import { ruleProfileRepository } from '../repositories/rule-profile-repository';
import { navigationRepository } from '../repositories/navigation-repository';
import { generateNavigationWindow } from '@pilot-tide-planner/navigation-engine';

export const navigationService = {
  async generate(date: string, profileId?: string) {
    const indicators = await tideIndicatorRepository.findByDate(date);
    const levels = await hourlyLevelRepository.findByDate(date);

    if (indicators.length === 0) {
      throw { status: 400, code: 'MISSING_DATA', message: 'No tide indicators for this date' };
    }
    if (levels.length === 0) {
      throw { status: 400, code: 'MISSING_DATA', message: 'No hourly tide levels for this date' };
    }

    let profile;
    if (profileId) {
      profile = await ruleProfileRepository.findById(profileId);
    } else {
      profile = await ruleProfileRepository.findActive();
    }
    if (!profile) {
      throw { status: 404, code: 'PROFILE_NOT_FOUND', message: 'No active rule profile found' };
    }

    const engineInput = {
      tideIndicators: indicators.map((i) => ({
        occurredAt: i.occurredAt,
        type: i.type as 'HIGH' | 'LOW',
        waterLevelFt: Number(i.waterLevelFt),
      })),
      hourlyLevels: levels.map((l) => ({
        recordedAt: l.recordedAt,
        waterLevelFt: Number(l.waterLevelFt),
      })),
      ruleProfile: {
        id: profile.id,
        name: profile.name,
        redDifference: Number(profile.redDifference),
        yellowDifference: Number(profile.yellowDifference),
        greenDifference: Number(profile.greenDifference),
        yellowDisabledStart: '07:00',
        yellowDisabledEnd: '19:00',
      },
    };

    const result = generateNavigationWindow(
      engineInput.tideIndicators,
      engineInput.hourlyLevels,
      engineInput.ruleProfile
    );

    await navigationRepository.deleteByDate(date);

    const saved = await navigationRepository.create({
      navigationDate: new Date(`${date}T00:00:00Z`),
      profileId: profile.id,
      status: 'GENERATED',
      items: result.items.map((item) => ({
        hour: item.hour,
        waterLevelFt: item.waterLevelFt,
        isRed: item.isRed,
        isYellow: item.isYellow,
        isGreen: item.isGreen,
      })),
    });

    return {
      id: saved.id,
      date: saved.navigationDate.toISOString().split('T')[0],
      status: saved.status,
    };
  },

  async getToday() {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return navigationRepository.findByDate(today);
  },

  async getByDate(date: string) {
    return navigationRepository.findByDate(date);
  },

  async getHistory(params: { page?: number; limit?: number; from?: string; to?: string }) {
    return navigationRepository.findWithPagination(params);
  },
};
