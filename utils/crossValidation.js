// utils/crossValidation.js

/**
 * Compara los top-N productos mostrados en la UI contra el catálogo completo
 * devuelto por la API interceptada.
 *
 * Reglas:
 * - Match por nombre normalizado (contains parcial, tolera truncamiento del DOM).
 * - Exige al menos `minMatches` de `uiProducts.length` encontrados en la API.
 * - Registra discrepancias de nombre y de precio para cada match encontrado.
 *
 * @param {Array} uiProducts   - [{ rawName, name, price }]
 * @param {Array} apiProducts  - [{ id, name, rawName, salePrice, sortPrice, listPrice }]
 * @param {number} minMatches  - mínimo de coincidencias requeridas (default 3)
 * @param {number} priceTolerance - tolerancia absoluta en precio antes de reportar discrepancia
 */
function crossValidateProducts(uiProducts, apiProducts, minMatches = 3, priceTolerance = 1) {
    const result = {
        totalUiProducts: uiProducts.length,
        matchedCount: 0,
        matches: [],
        unmatched: [],
        discrepancies: [],
        passed: false,
    };

    for (const uiProduct of uiProducts) {
        const apiMatch = findBestMatch(uiProduct, apiProducts);

        if (!apiMatch) {
            result.unmatched.push({
                uiName: uiProduct.rawName,
                reason: 'No se encontró ningún producto de la API cuyo nombre coincida (ni parcialmente) con el nombre mostrado en la UI.',
            });
            continue;
        }

        result.matchedCount++;
        result.matches.push({
            uiName: uiProduct.rawName,
            apiName: apiMatch.rawName,
            apiId: apiMatch.id,
        });

        // --- Validación de nombre exacto (no solo parcial) ---
        if (uiProduct.name !== apiMatch.name) {
            result.discrepancies.push({
                type: 'NAME_MISMATCH',
                productId: apiMatch.id,
                uiValue: uiProduct.rawName,
                apiValue: apiMatch.rawName,
                detail: 'El nombre coincide parcialmente pero no es idéntico tras normalizar (posible truncamiento o variante de texto en la UI).',
            });
        }

        // --- Validación de precio ---
        // La UI normalmente muestra salePrice (precio final con descuento aplicado).
        const apiPrice = apiMatch.salePrice;
        if (Number.isFinite(uiProduct.price) && Number.isFinite(apiPrice)) {
            const diff = Math.abs(uiProduct.price - apiPrice);
            if (diff > priceTolerance) {
                result.discrepancies.push({
                    type: 'PRICE_MISMATCH',
                    productId: apiMatch.id,
                    uiValue: uiProduct.price,
                    apiValue: apiPrice,
                    difference: diff,
                    detail: `Diferencia de $${diff.toFixed(2)} entre precio mostrado en UI y salePrice de la API.`,
                });
            }
        } else {
            result.discrepancies.push({
                type: 'PRICE_UNREADABLE',
                productId: apiMatch.id,
                uiValue: uiProduct.price,
                apiValue: apiPrice,
                detail: 'No fue posible comparar precios: alguno de los dos valores no es numérico.',
            });
        }
    }

    result.passed = result.matchedCount >= minMatches;
    return result;
}

/**
 * Busca el mejor match por nombre: prioriza igualdad exacta tras normalizar,
 * y si no hay, busca coincidencia parcial (contains en cualquier dirección)
 * para tolerar truncamiento de texto en tarjetas de producto.
 */
function findBestMatch(uiProduct, apiProducts) {
    const exact = apiProducts.find((p) => p.name === uiProduct.name);
    if (exact) return exact;

    const partial = apiProducts.find(
        (p) => p.name.includes(uiProduct.name) || uiProduct.name.includes(p.name)
    );
    if (partial) return partial;

    // Último recurso: comparar por las primeras 3-4 palabras significativas
    const uiTokens = uiProduct.name.split(' ').filter((t) => t.length > 2).slice(0, 4);
    return apiProducts.find((p) => uiTokens.every((t) => p.name.includes(t)));
}

/**
 * Imprime un reporte legible en consola (útil para logs de CI).
 */
function printCrossValidationReport(result) {
    console.log('\n========================================');
    console.log('REPORTE DE VALIDACIÓN CRUZADA UI vs API');
    console.log('========================================');
    console.log(`Productos UI evaluados: ${result.totalUiProducts}`);
    console.log(`Coincidencias encontradas en API: ${result.matchedCount}`);
    console.log(`Umbral requerido: >= 3 de 5`);
    console.log(`Resultado: ${result.passed ? '✅ APROBADO' : '❌ FALLIDO'}`);

    if (result.unmatched.length) {
        console.log('\n--- Productos NO encontrados en la API ---');
        result.unmatched.forEach((u) => console.log(`  • ${u.uiName}`));
    }

    if (result.discrepancies.length) {
        console.log('\n--- Discrepancias detectadas ---');
        result.discrepancies.forEach((d) => {
            console.log(`  [${d.type}] producto ${d.productId}`);
            console.log(`     UI:  ${d.uiValue}`);
            console.log(`     API: ${d.apiValue}`);
            console.log(`     ${d.detail}`);
        });
    } else {
        console.log('\nSin discrepancias de nombre/precio en los productos coincidentes.');
    }
    console.log('========================================\n');
}

module.exports = { crossValidateProducts, printCrossValidationReport };
