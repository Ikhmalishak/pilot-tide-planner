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

    const items: NavigationItemDomain[] = [];
    let nextHighForNearest: TideIndicatorDomain | undefined;
    let nearestRedIdx = -1;
    let nearestRedVal = -Infinity;
    let nearestYellowIdx = -1;
    let nearestYellowVal = -Infinity;
    let reachedRed = false;
    let reachedYellow = false;
    let reachedLowRed = false;
    let reachedLowGreen = false;
    let nearestLowRedIdx = -1;
    let nearestLowRedVal = -Infinity;
    let nearestLowGreenIdx = -1;
    let nearestLowGreenVal = -Infinity;

    for (let i = 0; i < sortedLevels.length; i++) {
      const level = sortedLevels[i];
      const levelTime = level.recordedAt.getTime();

      while (
        highIdx < this.highIndicators.length &&
        levelTime >= this.highIndicators[highIdx].occurredAt.getTime()
      ) {
        highIdx++;
        if (state === (EngineState.LOW_TIDE_RISING as EngineState) || state === EngineState.WAIT_HIGH_TIDE) {
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
          nextHighForNearest = undefined;
          reachedRed = false;
          reachedYellow = false;
          nearestRedIdx = -1;
          nearestRedVal = -Infinity;
          nearestYellowIdx = -1;
          nearestYellowVal = -Infinity;
          reachedLowRed = false;
          reachedLowGreen = false;
          nearestLowRedIdx = -1;
          nearestLowRedVal = -Infinity;
          nearestLowGreenIdx = -1;
          nearestLowGreenVal = -Infinity;
        }
      }

      const currentHigh = highIdx > 0 ? this.highIndicators[highIdx - 1] : this.firstHigh;
      const currentLow = lowIdx > 0 ? this.lowIndicators[lowIdx - 1] : undefined;
      const nextHigh = highIdx < this.highIndicators.length ? this.highIndicators[highIdx] : undefined;

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
      }

      if ((state === EngineState.LOW_TIDE_RISING || greenActive) && currentLow) {
        const redThreshold = currentLow.waterLevelFt + this.profile.redDifference;
        if (level.waterLevelFt >= redThreshold) {
          item.isRed = true;
          reachedLowRed = true;
        } else if (level.waterLevelFt > nearestLowRedVal) {
          nearestLowRedVal = level.waterLevelFt;
          nearestLowRedIdx = i;
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
          reachedLowGreen = true;
        } else if (greenActive && level.waterLevelFt < greenPeak) {
          greenActive = false;
          greenPeak = -Infinity;
        } else if (level.waterLevelFt > nearestLowGreenVal) {
          nearestLowGreenVal = level.waterLevelFt;
          nearestLowGreenIdx = i;
        }

        if (nextHigh) {
          if (nextHigh !== nextHighForNearest) {
            nextHighForNearest = nextHigh;
            reachedRed = false;
            reachedYellow = false;
            nearestRedIdx = -1;
            nearestRedVal = -Infinity;
            nearestYellowIdx = -1;
            nearestYellowVal = -Infinity;
          }
          const redThresholdHigh = nextHigh.waterLevelFt - this.profile.redDifference;
          const yellowThresholdHigh = nextHigh.waterLevelFt - this.profile.yellowDifference;

          if (level.waterLevelFt >= redThresholdHigh) {
            item.isRed = true;
            reachedRed = true;
          } else if (level.waterLevelFt > nearestRedVal) {
            nearestRedVal = level.waterLevelFt;
            nearestRedIdx = i;
          }

          if (level.waterLevelFt >= yellowThresholdHigh && !this.profile.isYellowDisabled(item.hourString)) {
            item.isYellow = true;
            reachedYellow = true;
          } else if (level.waterLevelFt > nearestYellowVal) {
            nearestYellowVal = level.waterLevelFt;
            nearestYellowIdx = i;
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

      items.push(item);
    }

    if (!reachedLowRed && nearestLowRedIdx >= 0) {
      items[nearestLowRedIdx].isRed = true;
    }
    if (!reachedLowGreen && nearestLowGreenIdx >= 0) {
      items[nearestLowGreenIdx].isGreen = true;
    }
    if (nextHighForNearest) {
      if (!reachedRed && nearestRedIdx >= 0) {
        items[nearestRedIdx].isRed = true;
      }
      if (!reachedYellow && nearestYellowIdx >= 0) {
        items[nearestYellowIdx].isYellow = true;
      }
    }

    return items;
  }
}
