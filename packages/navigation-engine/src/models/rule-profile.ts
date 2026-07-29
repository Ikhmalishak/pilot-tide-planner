export class RuleProfileDomain {
  constructor(
    public readonly name: string,
    public readonly redDifference: number,
    public readonly yellowDifference: number,
    public readonly greenDifference: number,
    public readonly yellowDisabledStart: string,
    public readonly yellowDisabledEnd: string
  ) {}

  isYellowDisabled(hour: string): boolean {
    return hour >= this.yellowDisabledStart && hour < this.yellowDisabledEnd;
  }
}
