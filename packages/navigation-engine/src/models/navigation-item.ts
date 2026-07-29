export class NavigationItemDomain {
  public isRed = false;
  public isYellow = false;
  public isGreen = false;

  constructor(
    public readonly hour: Date,
    public readonly waterLevelFt: number
  ) {}

  get hourString(): string {
    const h = this.hour.getUTCHours().toString().padStart(2, '0');
    const m = this.hour.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
