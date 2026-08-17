import { test, expect } from '@playwright/test';
import { LiverpoolPage } from '../pages/LiverpoolPage.js';
import { ColorFilter } from '../pages/ColorFilter.js';
import { SortFilter } from '../pages/SortFilter.js';
import { ResultsExtractor } from '../pages/ResultsExtractor.js';

test.describe('Liverpool - búsqueda de productos', () => {
    test('Buscar PlayStation 5, filtrar por Blanco y ordenar por precio', async ({ page }) => {
        const liverpool = new LiverpoolPage(page);
        const colorFilter = new ColorFilter(page);
        const sortFilter = new SortFilter(page);
        const resultsExtractor = new ResultsExtractor(page);
        // 1. Abrir Liverpool
        await liverpool.navigate();
        // 2. Buscar PlayStation 5
        //await page.screenshot({ path: 'debug-after-navigate.png', fullPage: true });
        await liverpool.searchProduct('playstation 5');
        // 3. Esperar y validar que la búsqueda se haya procesado
        await expect(page).toHaveURL(/.*playstation/i);
         // 4. Filtrar por color Blanco
        const countBefore = await colorFilter.getResultsCount();
        await colorFilter.filterByColor('Blanco');
        const countAfter = await colorFilter.getResultsCount();

        await sortFilter.sortByPriceAscending();
        const currentSort = await sortFilter.getCurrentSortLabel();
        console.log('Orden actual:', currentSort);
        expect(currentSort).toContain('Menor precio');
        // 5. Extraer nombre y precio de los primeros 5 resultados
        const topResults = await resultsExtractor.extractTopResults(5);
        resultsExtractor.printResults(topResults);

        expect(topResults.length).toBeGreaterThan(0);
        expect(topResults[0].price).toMatch(/^\$[\d,]+\.\d{2}$/);
        

  });
});
