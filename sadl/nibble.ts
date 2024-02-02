export class Nibble {
  private value: number;

  constructor(value: number = 0x00) {
    this.value = value & 0x0f;
  }

  public toString(): string {
    return this.value.toString(16).padStart(2, '0').charAt(1);
  }
}
