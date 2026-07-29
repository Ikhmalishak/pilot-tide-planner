export class HourlyTideLevelDomain {
  constructor(
    public readonly recordedAt: Date,
    public readonly waterLevelFt: number
  ) {}

  get hour(): string {
    const h = this.recordedAt.getHours().toString().padStart(2, '0');
    const m = this.recordedAt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
