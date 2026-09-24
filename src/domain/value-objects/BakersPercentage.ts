/**
 * Value Object imutável representando a Porcentagem de Padeiro (Baker's Percentage).
 * Invariante: Farinha total é sempre 100.0%. Todos os outros ingredientes são relativos.
 */
export class BakersPercentage {
  private readonly percent: number;

  constructor(percent: number) {
    if (Number.isNaN(percent) || !Number.isFinite(percent)) {
      throw new Error(`[BakersPercentage] Valor numérico inválido: ${percent}`);
    }
    if (percent < 0) {
      throw new Error(`[BakersPercentage] A porcentagem não pode ser negativa: ${percent}`);
    }
    this.percent = Math.round(percent * 100) / 100;
  }

  public static of(percent: number): BakersPercentage {
    return new BakersPercentage(percent);
  }

  /**
   * Calcula a porcentagem de padeiro a partir do peso do ingrediente e do peso total de farinha.
   */
  public static fromWeights(ingredientGrams: number, totalFlourGrams: number): BakersPercentage {
    if (totalFlourGrams <= 0) {
      throw new Error(`[BakersPercentage] O peso total de farinha deve ser estritamente positivo: ${totalFlourGrams}`);
    }
    return new BakersPercentage((ingredientGrams / totalFlourGrams) * 100);
  }

  public toNumber(): number {
    return this.percent;
  }

  /**
   * Dado o peso total de farinha, deriva o peso em gramas deste ingrediente.
   */
  public calculateWeight(totalFlourGrams: number): number {
    if (totalFlourGrams <= 0) {
      throw new Error(`[BakersPercentage] O peso total de farinha deve ser estritamente positivo: ${totalFlourGrams}`);
    }
    return Math.round(((this.percent / 100) * totalFlourGrams) * 10) / 10;
  }

  public format(): string {
    return `${this.percent % 1 === 0 ? this.percent.toFixed(0) : this.percent.toFixed(1)}%`;
  }
}
