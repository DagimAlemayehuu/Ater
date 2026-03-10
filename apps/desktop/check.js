const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.toString());
    });

    await page.goto('http://localhost:1420', { waitUntil: 'networkidle0' });
    const content = await page.content();
    if (content.includes('Something went wrong')) {
        console.log('App crashed and displayed ErrorBoundary');
        console.log(content);
    } else {
        console.log('Page loaded without ErrorBoundary');
    }

    await browser.close();
})();
