export class SortFilter {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Botón que abre el dropdown de ordenamiento
    this.sortButton = page.getByTestId('dropdown-sorting-button');
    // Listbox de opciones (aria-controls="sorting-options")
    this.sortOptionsList = page.locator('#sorting-options');
  }

  /**
   * Abre el dropdown de ordenamiento si no está ya abierto.
   */
  async openSortMenu() {
    const isExpanded = await this.sortButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.sortButton.click();
    }
    await this.sortOptionsList.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Ordena los resultados por precio de menor a mayor.
   */
  async sortByPriceAscending() {
    await this.openSortMenu();

    const option = this.sortOptionsList.getByRole('option', {
      name: 'Menor precio',
      exact: true,
    });

    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();

    // Esperamos a que el grid se actualice tras aplicar el orden
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }
  /**
   * Devuelve el texto actual mostrado en el botón de ordenamiento (útil para validar en el test).
   */
  async getCurrentSortLabel() {
    return this.sortButton.innerText();
  }
}