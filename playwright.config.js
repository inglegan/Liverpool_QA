const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',

    // Headless por defecto
    use: {
        headless: true,
        browserName: 'chromium',

        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        viewport: {
            width: 1440,
            height: 900
        }
    },

    reporter: [
        ['list'],
        ['html', { open: 'never',
                   outputFolder: 'playwright-report', }]
    ]
});


