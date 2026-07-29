import type { TideType } from '@pilot-tide-planner/shared-types';

export class TideIndicatorDomain {
  constructor(
    public readonly occurredAt: Date,
    public readonly type: TideType,
    public readonly waterLevelFt: number
  ) {}

  get hour(): string {
    const h = this.occurredAt.getHours().toString().padStart(2, '0');
    const m = this.occurredAt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
