// models/product.js

/**
 * Convierte la respuesta cruda de la API en un arreglo simple de productos,
 * usando la estructura real confirmada en el HAR:
 * { products: [ { recordTitle, productId, brand, variants: [ { color, prices: {...} } ] } ] }
 */
function mapApiResponseToProducts(json) {
    const rawProducts = json?.products ?? [];

    return rawProducts.map((p) => {
        const variant = p.variants?.[0] ?? {};
        const prices = variant.prices ?? {};

        return {
            id: p.productId,
            name: normalizeName(p.recordTitle),
            rawName: p.recordTitle,
            brand: p.brand,
            color: variant.color,
            salePrice: toNumber(prices.salePrice),
            listPrice: toNumber(prices.listPrice),
            sortPrice: toNumber(prices.sortPrice),
            isSponsored: !!p.isSponsored,
        };
    });
}

/**
 * Normaliza nombres para comparación: minúsculas, sin acentos, sin espacios extra.
 * Esto evita falsos negativos por diferencias de mayúsculas/tildes entre
 * el texto del DOM y el texto de la API.
 */
function normalizeName(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita acentos
        .replace(/\s+/g, ' ')
        .trim();
}

function toNumber(val) {
    if (val === undefined || val === null) return NaN;
    return Number(val);
}

module.exports = { mapApiResponseToProducts, normalizeName };
