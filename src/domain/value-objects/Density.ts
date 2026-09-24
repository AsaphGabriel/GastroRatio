import { Grams } from './Grams.js';
import { Milliliters } from './Milliliters.js';

/**
 * Value Object imutável representando densidade específica em g/ml.
 * Permite converter deterministamente volume em massa e vice-versa.
 */
export class Density {
  private readonly gramsPerMl: number;

  constructor(gramsPerMl: number) {
    if (Number.isNaN(gramsPerMl) || !Number.isFinite(gramsPerMl)) {
      throw new Error(`[Density] Valor numérico inválido: ${gramsPerMl}`);
    }
    if (gramsPerMl <= 0) {
      throw new Error(`[Density] A densidade deve ser estritamente positiva (> 0): ${gramsPerMl}`);
    }
    this.gramsPerMl = gramsPerMl;
  }

  public static of(gramsPerMl: number): Density {
    return new Density(gramsPerMl);
  }

  public toNumber(): number {
    return this.gramsPerMl;
  }

  /**
   * Converte volume (ml) para massa (g) aplicando a densidade: massa = volume * densidade.
   */
  public toGrams(volume: Milliliters): Grams {
    return Grams.of(volume.toNumber() * this.gramsPerMl);
  }

  /**
   * Converte massa (g) para volume (ml) aplicando a densidade: volume = massa / densidade.
   */
  public toMilliliters(mass: Grams): Milliliters {
    return Milliliters.of(mass.toNumber() / this.gramsPerMl);
  }
}
