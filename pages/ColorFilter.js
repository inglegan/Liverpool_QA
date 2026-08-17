export class ColorFilter {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Contenedor de los tiles de filtro (color, marca, etc.)
    this.filterTilesContainer = page.getByTestId('tiles-navigations-button');

    // Tarjetas de producto en el grid de resultados (para validar que el filtro se aplicó)
    this.productCards = page.locator('a[href*="/tienda/pdp/"]');
  }

  /**
   * Filtra los resultados por color usando los botones tipo "tile".
   * @param {string} color - ej. "Blanco"
   */
  async filterByColor(color) {
    const colorButton = this.filterTilesContainer.getByRole('button', {
      name: color,
      exact: true,
    }).first();

    await colorButton.waitFor({ state: 'visible', timeout: 10000 });

    const countBefore = await this.productCards.count();
    await colorButton.click();

    //await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForFunction(
      (prev) => document.querySelectorAll('a[href*="/tienda/pdp/"]').length !== prev,
      countBefore,
      { timeout: 10000 }
    ).catch(() => {});
  }

  /**
   * Devuelve el número actual de resultados en el grid.
   * Útil para validar antes/después del filtro en el test.
   */
  async getResultsCount() {
    return this.productCards.count();
  }
}
