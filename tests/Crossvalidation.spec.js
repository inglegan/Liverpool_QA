// tests/crossValidation.spec.js
const { test, expect } = require('@playwright/test');
const { captureSearchApiResponse } = require('../utils/networkCapture');
const { mapApiResponseToProducts } = require('../models/product');
const { crossValidateProducts, printCrossValidationReport } = require('../utils/crossValidation');
const { SearchResultsPage } = require('../pages/SearchResultsPage');

// URL real confirmada desde el HAR: https://www.liverpool.com.mx/web-bff/product/search
const PRODUCT_API_PATTERN = /\/web-bff\/product\/search/i;

test('Validación cruzada UI vs API - PlayStation 5, filtro Blanco, menor precio', async ({ page }) => {
    const resultsPage = new SearchResultsPage(page);

    await resultsPage.goto();
    await resultsPage.search('playstation 5');

    // Captura la respuesta de la API que trae el listado inicial de resultados
    const initialApiJson = await captureSearchApiResponse(
        page,
        async () => {
            await resultsPage.selectSuggestion('blt26617d4f2e17657d-suggestion-playstation_5');
        },
        PRODUCT_API_PATTERN
    );

    // Captura la respuesta tras aplicar el filtro de color "Blanco"
    const filteredApiJson = await captureSearchApiResponse(
        page,
        async () => {
            await resultsPage.applyColorFilter('Blanco');
        },
        PRODUCT_API_PATTERN
    );

    // Captura la respuesta final tras ordenar por "Menor precio" — esta es la fuente de verdad
    const finalApiJson = await captureSearchApiResponse(
        page,
        async () => {
            await resultsPage.sortByLowestPrice();
        },
        PRODUCT_API_PATTERN
    );

    const apiProducts = mapApiResponseToProducts(finalApiJson);
    expect(apiProducts.length, 'La API debe devolver al menos un producto').toBeGreaterThan(0);

    // --- Extracción del DOM ---
    const uiProducts = await resultsPage.getTopNProducts(5);
    expect(uiProducts.length, 'La UI debe mostrar 5 productos para comparar').toBe(5);

    // --- Validación cruzada ---
    const result = crossValidateProducts(uiProducts, apiProducts, /* minMatches */ 3, /* priceTolerance */ 1);
    printCrossValidationReport(result);

    // Guardar el reporte como artefacto para CI (JSON + log legible)
    const fs = require('fs');
    fs.mkdirSync('test-results/cross-validation', { recursive: true });
    fs.writeFileSync(
        'test-results/cross-validation/report.json',
        JSON.stringify(result, null, 2)
    );

    // --- Aserciones ---
    expect(
        result.matchedCount,
        `Se requieren al menos 3 de 5 productos de la UI presentes en la API. Encontrados: ${result.matchedCount}`
    ).toBeGreaterThanOrEqual(3);

    // Las discrepancias no rompen el test por sí solas (son de negocio, no de estructura),
    // pero se documentan explícitamente para revisión humana / reporte de QA.
    if (result.discrepancies.length > 0) {
        console.warn(
            `⚠️  Se registraron ${result.discrepancies.length} discrepancias de nombre/precio. Ver test-results/cross-validation/report.json`
        );
    }
});