import { test } from '@playwright/test';

test('Capturar HAR completo - PlayStation 5 filtro blanco + menor precio', async ({ browser }) => {

    const context = await browser.newContext({
        recordHar: {
            path: 'liverpool-trace.har',
            content: 'embed', // incluye los bodies de las respuestas dentro del HAR
        },
    });

    const page = await context.newPage();

    await page.goto('https://www.liverpool.com.mx/tienda/home');

    const search = page.getByRole('textbox', {
        name: 'Buscar por producto, categorí'
    });
    await search.fill('playstation 5');

    await page.getByTestId(
        'blt26617d4f2e17657d-suggestion-playstation_5'
    ).click();

    await page.waitForSelector('text=/artículos/i');

    // Aplica aquí tus filtros reales (ajusta selectores con codegen)
    await page.getByRole('checkbox', { name: 'Blanco' }).click();
    await page.waitForTimeout(2000);

    await page.getByText('Ordenar por').click();
    await page.getByText('Menor precio', { exact: true }).click();
    await page.waitForTimeout(3000);

    // Cerrar el contexto es lo que finaliza la escritura del archivo HAR
    await context.close();
});