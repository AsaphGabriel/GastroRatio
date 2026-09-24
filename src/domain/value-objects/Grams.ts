/**
 * Value Object imutável representando massa em gramas (g).
 * Garante invariante de valor não-negativo e operações aritméticas seguras.
 */
export class Grams {
  private readonly value: number;

  constructor(value: number) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error(`[Grams] Valor numérico inválido: ${value}`);
    }
    if (value < 0) {
      throw new Error(`[Grams] A massa em gramas não pode ser negativa: ${value}`);
    }
    this.value = Math.round(value * 100) / 100; // Precisão de 2 casas decimais
  }

  public static of(value: number): Grams {
    return new Grams(value);
  }

  public toNumber(): number {
    return this.value;
  }

  public toKilograms(): number {
    return Math.round((this.value / 1000) * 1000) / 1000;
  }

  public add(other: Grams): Grams {
    return new Grams(this.value + other.value);
  }

  public subtract(other: Grams): Grams {
    const result = this.value - other.value;
    if (result < 0) {
      throw new Error(`[Grams] Subtração resultou em massa negativa: ${result}`);
    }
    return new Grams(result);
  }

  public multiply(factor: number): Grams {
    if (factor < 0) {
      throw new Error(`[Grams] Fator de multiplicação não pode ser negativo: ${factor}`);
    }
    return new Grams(this.value * factor);
  }

  public divide(divisor: number): Grams {
    if (divisor <= 0) {
      throw new Error(`[Grams] Divisor deve ser estritamente positivo: ${divisor}`);
    }
    return new Grams(this.value / divisor);
  }

  public equals(other: Grams, epsilon: number = 0.01): boolean {
    return Math.abs(this.value - other.value) <= epsilon;
  }

  public format(decimals: number = 1): string {
    if (this.value >= 1000) {
      const kg = this.toKilograms();
      return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(decimals)} kg`;
    }
    return `${this.value % 1 === 0 ? this.value.toFixed(0) : this.value.toFixed(decimals)} g`;
  }
}
