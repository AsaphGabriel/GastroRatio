/**
 * Value Object imutável representando volume em mililitros (ml).
 * Garante invariante de valor não-negativo.
 */
export class Milliliters {
  private readonly value: number;

  constructor(value: number) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error(`[Milliliters] Valor numérico inválido: ${value}`);
    }
    if (value < 0) {
      throw new Error(`[Milliliters] O volume em mililitros não pode ser negativo: ${value}`);
    }
    this.value = Math.round(value * 100) / 100;
  }

  public static of(value: number): Milliliters {
    return new Milliliters(value);
  }

  public toNumber(): number {
    return this.value;
  }

  public toLiters(): number {
    return Math.round((this.value / 1000) * 1000) / 1000;
  }

  public add(other: Milliliters): Milliliters {
    return new Milliliters(this.value + other.value);
  }

  public multiply(factor: number): Milliliters {
    if (factor < 0) {
      throw new Error(`[Milliliters] Fator não pode ser negativo: ${factor}`);
    }
    return new Milliliters(this.value * factor);
  }

  public equals(other: Milliliters, epsilon: number = 0.01): boolean {
    return Math.abs(this.value - other.value) <= epsilon;
  }

  public format(decimals: number = 1): string {
    if (this.value >= 1000) {
      const l = this.toLiters();
      return `${l % 1 === 0 ? l.toFixed(0) : l.toFixed(decimals)} L`;
    }
    return `${this.value % 1 === 0 ? this.value.toFixed(0) : this.value.toFixed(decimals)} ml`;
  }
}
