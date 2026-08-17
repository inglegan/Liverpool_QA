// pages/SearchResultsPage.js
const { normalizeName } = require('../models/product');

class SearchResultsPage {
    constructor(page) {
        this.page = page;
        // AJUSTAR selector con el real confirmado vía codegen/inspección del DOM
        this.productCards = page.locator('[data-testid="product-card"], .product-card, .product-tile');
        this.searchBox = page.getByRole('textbox', { name: 'Buscar por producto, categorí' });
        this.sortDropdown = page.getByText('Ordenar por');
    }

    async goto() {
        await this.page.goto('https://www.liverpool.com.mx/tienda/home');
    }

    async search(term) {
        await this.searchBox.fill(term);
    }

    async selectSuggestion(testId) {
        await this.page.getByTestId(testId).click();
        await this.page.waitForSelector('text=/artículos/i');
    }

    async applyColorFilter(colorLabel) {
        // AJUSTAR selector real (checkbox/link) confirmado vía codegen
        await this.page.getByRole('checkbox', { name: colorLabel }).click();
        await this.page.waitForTimeout(500); // margen breve para actualización de UI
    }

    async sortByLowestPrice() {
        await this.sortDropdown.click();
        await this.page.getByText('Menor precio', { exact: true }).click();
    }

    async getTopNProducts(n) {
        await this.productCards.first().waitFor({ state: 'visible' });
        const cards = await this.productCards.all();
        const top = cards.slice(0, n);

        const products = [];
        for (const card of top) {
            const rawName = (await card.locator('[data-testid="product-name"], .product-name').innerText()).trim();
            const priceText = (await card.locator('[data-testid="product-price"], .product-price').innerText()).trim();
            const price = Number(priceText.replace(/[^0-9.]/g, ''));

            products.push({
                rawName,
                name: normalizeName(rawName),
                price,
            });
        }
        return products;
    }
}

module.exports = { SearchResultsPage };
