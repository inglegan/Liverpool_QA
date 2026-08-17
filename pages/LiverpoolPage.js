export class LiverpoolPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Dos inputs comparten el mismo testid (desktop=text, mobile=search)
    // Filtramos al que es visible en este momento
    this.searchInput = page
      .getByTestId('blt26617d4f2e17657d-header-search-input')
      .locator('visible=true')
      .first();
  }

  async navigate() {
    await this.page.goto('https://www.liverpool.com.mx/tienda/home', {
      waitUntil: 'domcontentloaded',
    });

    // Cerrar banner de cookies si aparece (no aplica en este sitio, pero por si acaso)
    const cookieBtn = this.page.locator('#onetrust-accept-btn-handler');
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
    }
  }

  async searchProduct(productName) {
    await this.searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.searchInput.click();
    await this.searchInput.fill(productName);
    await this.searchInput.press('Enter');
  }
}