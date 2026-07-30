import { TideIndicatorDomain } from '../models/tide-indicator';
import { HourlyTideLevelDomain } from '../models/hourly-tide-level';
import { RuleProfileDomain } from '../models/rule-profile';
import { NavigationItemDomain } from '../models/navigation-item';

export enum EngineState {
  WAIT_HIGH_TIDE = 'WAIT_HIGH_TIDE',
  HIGH_TIDE_DESCENDING = 'HIGH_TIDE_DESCENDING',
  WAIT_LOW_TIDE = 'WAIT_LOW_TIDE',
  LOW_TIDE_RISING = 'LOW_TIDE_RISING',
}

export class NavigationProcessor {
  private readonly firstHigh: TideIndicatorDomain | undefined;
  private readonly highIndicators: TideIndicatorDomain[];
  private readonly lowIndicators: TideIndicatorDomain[];

  constructor(
    private readonly indicators: TideIndicatorDomain[],
    private readonly profile: RuleProfileDomain
  ) {
    this.indicators.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    this.highIndicators = this.indicators.filter((i) => i.type === 'HIGH');
    this.lowIndicators = this.indicators.filter((i) => i.type === 'LOW');
    this.firstHigh = this.highIndicators[0];
  }

  process(hourlyLevels: HourlyTideLevelDomain[]): NavigationItemDomain[] {
    const sortedLevels = [...hourlyLevels].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
    );

    if (!this.firstHigh) {
      return sortedLevels.map((l) => new NavigationItemDomain(l.recordedAt, l.waterLevelFt));
    }

    let state: EngineState = EngineState.HIGH_TIDE_DESCENDING;
    let highIdx = 0;
    let lowIdx = 0;
    let greenActive = false;
    let greenPeak = -Infinity;

    return sortedLevels.map((level) => {
      const levelTime = level.recordedAt.getTime();

      while (
        highIdx < this.highIndicators.length &&
        levelTime >= this.highIndicators[highIdx].occurredAt.getTime()
      ) {
        highIdx++;
        if (state === EngineState.LOW_TIDE_RISING || state === EngineState.WAIT_HIGH_TIDE) {
          state = EngineState.HIGH_TIDE_DESCENDING;
        }
      }

      while (
        lowIdx < this.lowIndicators.length &&
        levelTime >= this.lowIndicators[lowIdx].occurredAt.getTime()
      ) {
        lowIdx++;
        if (state === EngineState.HIGH_TIDE_DESCENDING || state === EngineState.WAIT_LOW_TIDE) {
          state = EngineState.LOW_TIDE_RISING;
          greenActive = false;
          greenPeak = -Infinity;
        }
      }

      const currentHigh = highIdx > 0 ? this.highIndicators[highIdx - 1] : this.firstHigh;
      const currentLow = lowIdx > 0 ? this.lowIndicators[lowIdx - 1] : undefined;
      const nextHigh = highIdx < this.highIndicators.length ? this.highIndicators[highIdx] : undefined;
      const nextLow = lowIdx < this.lowIndicators.length ? this.lowIndicators[lowIdx] : undefined;

      const item = new NavigationItemDomain(level.recordedAt, level.waterLevelFt);

      if (state === EngineState.HIGH_TIDE_DESCENDING && currentHigh) {
        const redThreshold = currentHigh.waterLevelFt - this.profile.redDifference;
        if (level.waterLevelFt >= redThreshold) {
          item.isRed = true;
        }
        const yellowThreshold = currentHigh.waterLevelFt - this.profile.yellowDifference;
        if (level.waterLevelFt >= yellowThreshold && !this.profile.isYellowDisabled(item.hourString)) {
          item.isYellow = true;
        }
        if (nextLow) {
          const redThresholdLow = nextLow.waterLevelFt + this.profile.redDifference;
          if (level.waterLevelFt >= redThresholdLow) {
            item.isRed = true;
          }
          const yellowThresholdLow = nextLow.waterLevelFt + this.profile.yellowDifference;
          if (level.waterLevelFt >= yellowThresholdLow && !this.profile.isYellowDisabled(item.hourString)) {
            item.isYellow = true;
          }
        }
      }

      if ((state === EngineState.LOW_TIDE_RISING || greenActive) && currentLow) {
        const redThreshold = currentLow.waterLevelFt + this.profile.redDifference;
        if (level.waterLevelFt >= redThreshold) {
          item.isRed = true;
        }
        const yellowThreshold = currentLow.waterLevelFt + this.profile.yellowDifference;
        if (level.waterLevelFt >= yellowThreshold && !this.profile.isYellowDisabled(item.hourString)) {
          item.isYellow = true;
        }
        const greenThreshold = currentLow.waterLevelFt + this.profile.greenDifference;
        if (level.waterLevelFt >= greenThreshold) {
          if (!greenActive) {
            greenActive = true;
            greenPeak = level.waterLevelFt;
          }
          if (level.waterLevelFt >= greenPeak) {
            item.isGreen = true;
            greenPeak = level.waterLevelFt;
          } else {
            greenActive = false;
            greenPeak = -Infinity;
          }
        } else if (greenActive && level.waterLevelFt < greenPeak) {
          greenActive = false;
          greenPeak = -Infinity;
        }
        if (nextHigh) {
          const redThresholdHigh = nextHigh.waterLevelFt - this.profile.redDifference;
          if (level.waterLevelFt >= redThresholdHigh) {
            item.isRed = true;
          }
          const yellowThresholdHigh = nextHigh.waterLevelFt - this.profile.yellowDifference;
          if (level.waterLevelFt >= yellowThresholdHigh && !this.profile.isYellowDisabled(item.hourString)) {
            item.isYellow = true;
          }
        }
      }

      if (state === EngineState.HIGH_TIDE_DESCENDING && currentHigh) {
        const redThreshold = currentHigh.waterLevelFt - this.profile.redDifference;
        if (level.waterLevelFt < redThreshold) {
          state = EngineState.WAIT_LOW_TIDE;
        }
      }

      if (state === EngineState.LOW_TIDE_RISING && currentLow) {
        const greenThreshold = currentLow.waterLevelFt + this.profile.greenDifference;
        if (level.waterLevelFt >= greenThreshold) {
          state = EngineState.WAIT_HIGH_TIDE;
        }
      }

      return item;
    });
  }
}
