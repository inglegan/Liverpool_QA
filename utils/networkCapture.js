// utils/networkCapture.js

/**
 * Espera y captura la respuesta de la API de catálogo/búsqueda mientras
 * ejecuta la acción que la dispara (aplicar filtro de color, cambiar orden, etc.)
 *
 * IMPORTANTE: ajustar `urlPattern` con la URL real confirmada desde el HAR.
 * Patrón provisional basado en lo ya observado (web-bff/content/*).
 */
async function captureSearchApiResponse(page, triggerAction, urlPattern = /web-bff\/(search|content)/i) {
    const [response] = await Promise.all([
        page.waitForResponse(
            (res) => urlPattern.test(res.url()) && res.status() === 200,
            { timeout: 15000 }
        ),
        triggerAction(),
    ]);

    return response.json();
}

/**
 * Captura TODAS las respuestas que contengan productos durante una sesión,
 * útil cuando no se sabe con certeza cuál de varias llamadas es la definitiva
 * (por ejemplo, si la búsqueda dispara typeahead + listado en paralelo).
 */
function attachProductResponseCollector(page, urlPattern = /web-bff\/(search|content)/i) {
    const captured = [];

    page.on('response', async (response) => {
        if (!urlPattern.test(response.url())) return;

        const contentType = response.headers()['content-type'] || '';
        if (!contentType.includes('application/json')) return;

        try {
            const data = await response.json();
            const json = JSON.stringify(data);
            if (json.includes('recordTitle') && json.includes('products')) {
                captured.push({ url: response.url(), data });
            }
        } catch {
            // respuesta no parseable, se ignora
        }
    });

    return captured;
}

module.exports = { captureSearchApiResponse, attachProductResponseCollector };
