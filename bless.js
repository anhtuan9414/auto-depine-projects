const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
const path = require('path');

const setupLogging = (args) => {
    console.log = (...args) => console.info(new Date().toISOString(), ...args);
    console.error = (...args) => console.error(new Date().toISOString(), ...args);
};

const waitForElementExists = async (page, selector, timeout = 10000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const checkActiveElement = async (page) => {
    try {
		if (await waitForElementExists(page, 'button[data-state="unchecked"]')){
			console.log("Extension is unchecked!");
			await page.click('button[data-state="unchecked"]');
		}
        await page.waitForSelector('button[data-state="checked"]', { timeout: 10000 });
        console.log("Extension is checked!");
    } catch {
        console.error("Failed to find 'checked' element. Extension activation failed.");
    }
};

const setLocalStorageItem = async (page, key, value) => {
    await page.evaluate((key, value) => {
        localStorage.setItem(key, value);
        return localStorage.getItem(key);
    }, key, value);
};

const addCookieToLocalStorage = async (page, cookieValue) => {
    const result = await setLocalStorageItem(page, 'B7S_AUTH_TOKEN', cookieValue);
    console.log("Your token can be used to log in for 7 days.");
};

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const cookie = process.env.BLESS_TOKEN;
    const extensionId = 'pljbjcehnhcnofmkdbjolghdcjnmekia';
    const extensionUrl = `chrome-extension://${extensionId}/index.html`;

    if (!cookie) {
        console.error('No cookie provided. Please set the B7S_AUTH_TOKEN environment variable.');
        return;
    }
	const pathToBless = path.join(process.cwd(), "bless");
    const browserArgs = [
		"--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-zygote",
        "--disable-software-rasterizer",
        "--disable-notifications",
        "--disable-background-networking",
        "--disable-features=site-per-process,AudioServiceOutOfProcess",
        "--mute-audio",
        "--disable-sync",
        "--disable-extensions",
        "--disable-popup-blocking",
        `--disable-extensions-except=${pathToBless}`,
        `--load-extension=${pathToBless}`,
        '--window-size=1024,768',
    ];

    let browser, page;

    try {
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        console.log(`Navigating to https://bless.network/dashboard website...`);
        await page.goto('https://bless.network/dashboard', { waitUntil: "load" });

        await addCookieToLocalStorage(page, cookie);

        while (!(await waitForElementExists(page, "::-p-xpath(//*[text()='Connected'])"))) {
            console.log(`Refreshing to check login...`);
            await page.goto('https://bless.network/dashboard');
        }
		
        console.log('Logged in successfully!');

        await page.goto(extensionUrl);
        while (await waitForElementExists(page, "::-p-xpath(//*[text()='Log in'])")) {
            console.log('Clicking the extension login button...');
            await page.click("::-p-xpath(//*[text()='Log in'])");
			await new Promise((_func) => setTimeout(_func, 10000));
            await page.reload();
        }

        await checkActiveElement(page);

        console.log('Monitoring connection status...');
        setInterval(async () => {
            try {
                await page.reload({ waitUntil: 'load' });
                if (await waitForElementExists(page, "::-p-xpath(//*[text()='Connected'])")) {
                    console.log("Status: Connected!");
                } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Disconnected'])")) {
                    console.error("Status: Disconnected!");
					await checkActiveElement(page);
                } else {
                    console.error("Status: Unknown!");
                }
            } catch (err) {
                console.error('Error refreshing page:', err);
            }
        }, 300000);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
