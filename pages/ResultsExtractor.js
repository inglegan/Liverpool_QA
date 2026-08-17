export class ResultsExtractor {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Tarjetas de producto (enlaces que llevan al detalle del producto)
    this.productCards = page.locator('a[href*="/tienda/pdp/"]');
  }

  /**
   * Extrae nombre y precio de los primeros N resultados.
   * @param {number} count
   * @returns {Promise<Array<{name: string, price: string}>>}
   */
  async extractTopResults(count = 5) {
    await this.productCards.first().waitFor({ state: 'visible', timeout: 15000 });

    const total = Math.min(await this.productCards.count(), count);
    const results = [];

    for (let i = 0; i < total; i++) {
      const card = this.productCards.nth(i);

      // Nombre del producto (h3)
      const name = (await card.locator('h3').first().innerText().catch(() => 'N/A')).trim();

      // Precio: usamos textContent (no innerText) para capturar el punto decimal oculto
      const priceContainer = card.locator('[data-testid$="-price"]').first();
      const rawPrice = (await priceContainer.textContent().catch(() => '')) || '';

      // Limpiamos espacios/saltos de línea que puedan colarse entre los spans anidados
      const price = this._normalizePrice(rawPrice);

      results.push({ name, price });
    }

    return results;
  }

  /**
   * Normaliza el texto crudo del precio a formato "$12,499.00".
   * @param {string} rawPrice
   */
  _normalizePrice(rawPrice) {
    const cleaned = rawPrice.replace(/\s+/g, '').trim();
    const match = cleaned.match(/\$[\d,]+\.\d{2}/);
    return match ? match[0] : cleaned || 'N/A';
  }

  /**
   * Imprime los resultados en consola en formato tabla.
   * @param {Array<{name: string, price: string}>} results
   */
  printResults(results) {
    console.log('\n=== Top 5 resultados ===');
    console.table(results);
  }
}