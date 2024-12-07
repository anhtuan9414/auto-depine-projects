const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
const path = require('path');

const waitForElementExists = async (page, selector, timeout = 10000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const clickConnectElement = async (page) => {
    try {
		if (await waitForElementExists(page, "::-p-xpath(//*[text()='Connect Node'])")){
			console.log('Clicking the extension Connect Node button...');
			await page.click("::-p-xpath(//*[text()='Connect Node'])");
			console.log('Connecting...');
		}
        await page.waitForSelector("::-p-xpath(//*[text()='Connected'])", { timeout: 10000 });
        console.error("Status: Connected!");
    } catch {
        console.error("Failed to click 'Connect Node' element. Extension activation failed.");
    }
};

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const extensionId = 'emcclcoaglgcpoognfiggmhnhgabppkm';
    const extensionUrl = `chrome-extension://${extensionId}/index.html`;

	const pathToTeoneo = path.join(process.cwd(), "teoneo");
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
        `--disable-extensions-except=${pathToTeoneo}`,
        `--load-extension=${pathToTeoneo}`,
        '--window-size=1024,768',
    ];

    let browser, page;

    try {
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = await browser.newPage();
		(await browser.pages())[0].close();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        console.log(`Navigating to ${extensionUrl} ...`);
        await page.goto(extensionUrl , {waitUntil: "networkidle2", timeout: 0});
		
		const conncetNode = async () => {
			if (await waitForElementExists(page, "::-p-xpath(//*[text()='Continue'])")) {
				await page.waitForSelector("::-p-xpath(//*[text()='Continue'])", { timeout: 10000 });
				console.log('Clicking the extension Continue button...');
				await page.click("::-p-xpath(//*[text()='Continue'])");
			}
			
			const sendLogin = async () => {
				try {
					await new Promise((_func) => setTimeout(_func, 3000));
					// Wait for the login form to load
					await page.waitForSelector('input[type="email"]', { timeout: 10000 });
					await page.waitForSelector('input[type="password"]');
					await page.type('input[type="email"]', process.env.TEONEO_USERNAME, { delay: 50 }); // Simulate typing
					await page.type('input[type="password"]', process.env.TEONEO_PASSWORD, { delay: 50 });

					// Click the login button
					await page.click('button');
					await page.waitForSelector("::-p-xpath(//*[text()='Connect Node'])");
					console.log('Login successful!');
					return true;
				}catch {
					console.log('Login failed!');
					return false;
				}
			}
		
			while (!(await sendLogin())) {
					console.log('Trying login...');
					await page.reload();
			}
			
			await clickConnectElement(page);
		}
		
		await conncetNode();
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		
		console.log('Monitoring connection status...');
        setInterval(async () => {
            try {
				await page.goto(extensionUrl , {waitUntil: "networkidle2", timeout: 0});
				//await page.reload({waitUntil: "networkidle2"});
                if (await waitForElementExists(page, "::-p-xpath(//*[text()='Connected'])")) {
					const rs = await page.evaluate(() => {
						const elements = document.querySelectorAll('#root > div > div > div.flex.flex-col.gap-2.border.border-gray-500.p-2 div.items-center');
						const rs = {};
		
						for (let i = 0; i < elements.length; i++) {
							const value = elements[i].querySelector('p').textContent.trim();
							const name = elements[i].querySelector('h2').textContent.trim();
							rs[name] = value;
						}
						return rs;
					});
                    console.log("Status: Connected!");
                    Object.keys(rs).forEach(key => {
						console.log(key + ':', rs[key]);
					})
                } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Not connected'])")) {
                    console.error("Status: Disconnected!");
					await clickConnectElement(page);
                } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Continue'])") || await waitForElementExists(page, 'input[type="email"]')) {
					await conncetNode();
                } else {
					console.error("Status: Unknown!");
				}
            } catch (err) {
                console.error('Error refreshing page:', err);
            }
			const page2 = await browser.newPage();
			page.close();
			page = page2;
        }, 3600000);
		
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
