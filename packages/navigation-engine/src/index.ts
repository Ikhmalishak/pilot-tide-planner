import type { TideIndicator, HourlyTideLevel, RuleProfile, NavigationItem, NavigationWindow } from '@pilot-tide-planner/shared-types';
import { TideIndicatorDomain } from './models/tide-indicator';
import { HourlyTideLevelDomain } from './models/hourly-tide-level';
import { RuleProfileDomain } from './models/rule-profile';
import { NavigationProcessor } from './rules/processor';
import * as thresholds from './calculators/thresholds';

export function generateNavigationWindow(
  tideIndicators: TideIndicator[],
  hourlyLevels: HourlyTideLevel[],
  ruleProfile: RuleProfile
): NavigationWindow {
  if (tideIndicators.length === 0) {
    throw new Error('No tide indicators provided');
  }
  if (hourlyLevels.length === 0) {
    throw new Error('No hourly tide levels provided');
  }

  const indicatorDomains = tideIndicators.map(
    (i) => new TideIndicatorDomain(i.occurredAt, i.type, i.waterLevelFt)
  );
  const levelDomains = hourlyLevels.map(
    (l) => new HourlyTideLevelDomain(l.recordedAt, l.waterLevelFt)
  );
  const profileDomain = new RuleProfileDomain(
    ruleProfile.name,
    ruleProfile.redDifference,
    ruleProfile.yellowDifference,
    ruleProfile.greenDifference,
    ruleProfile.yellowDisabledStart,
    ruleProfile.yellowDisabledEnd
  );

  const processor = new NavigationProcessor(indicatorDomains, profileDomain);
  const processedItems = processor.process(levelDomains);

  const items: NavigationItem[] = processedItems.map((item) => ({
    hour: item.hour,
    waterLevelFt: item.waterLevelFt,
    isRed: item.isRed,
    isYellow: item.isYellow,
    isGreen: item.isGreen,
  }));

  const window: NavigationWindow = {
    navigationDate: hourlyLevels[0].recordedAt,
    profileId: ruleProfile.id || '',
    status: 'GENERATED',
    items,
  };

  return window;
}

export { thresholds };
export { TideIndicatorDomain, HourlyTideLevelDomain, RuleProfileDomain, NavigationProcessor };
