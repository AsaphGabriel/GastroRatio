/**
 * Utilitário centralizado de geração de IDs seguros (CWE-330).
 *
 * Estratégia de fallback em cascata:
 * 1. crypto.randomUUID()       → UUID v4 nativo (Secure Context: HTTPS / localhost)
 * 2. crypto.getRandomValues()  → 16 bytes aleatórios formatados como hex (funciona em HTTP local)
 * 3. Date.now() + Math.random  → último recurso (entropy reduzida, mas nunca lança)
 *
 * Níveis 2 e 3 garantem que o app funcione em testes via IP de rede local
 * (ex: http://192.168.x.x:5173 na bancada da cozinha) sem TypeError.
 */
function randomSegment(): string {
  // Nível 1: UUID v4 criptograficamente seguro (Secure Contexts apenas)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Nível 2: getRandomValues — disponível em HTTP (não exige Secure Context)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Formata como UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    return [...bytes]
      .map((b, i) =>
        [4, 6, 8, 10].includes(i)
          ? '-' + b.toString(16).padStart(2, '0')
          : b.toString(16).padStart(2, '0')
      )
      .join('');
  }

  // Nível 3: Fallback de último recurso (ambientes sem Web Crypto)
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Gera um ID único com prefixo semântico.
 *
 * @param prefix - Prefixo legível para debug (ex: 'rec', 'ing', 'p')
 * @returns string no formato '<prefix>-<uuid>'
 *
 * @example
 * generateId('rec')  // 'rec-550e8400-e29b-41d4-a716-446655440000'
 * generateId('ing')  // 'ing-6ba7b810-9dad-11d1-80b4-00c04fd430c8'
 */
export function generateId(prefix: string): string {
  return `${prefix}-${randomSegment()}`;
}
