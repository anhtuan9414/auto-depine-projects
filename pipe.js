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

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const extensionId = 'gelgmmdfajpefjbiaedgjkpekijhkgbe';
    const extensionUrl = `chrome-extension://${extensionId}/popup.html`;

	const pathToTeoneo = path.join(process.cwd(), "pipe");
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
		
		
		const sendLogin = async () => {
			try {
				await new Promise((_func) => setTimeout(_func, 3000));
				// Wait for the login form to load
				await page.waitForSelector('input[type="email"]', { timeout: 10000 });
				await page.waitForSelector('input[type="password"]');
				await page.type('input[type="email"]', process.env.PIPE_USERNAME, { delay: 50 }); // Simulate typing
				await page.type('input[type="password"]', process.env.PIPE_PASSWORD, { delay: 50 });

				// Click the login button
				await page.click('button#login-btn');
				await new Promise((_func) => setTimeout(_func, 10000));
				const isHidden = await page.$eval('#login-container', (element) => {
				  return window.getComputedStyle(element).display === 'none';
				});
				
				if (!isHidden) {
					throw 'Login failed!';
				}
				
				console.log('Login successful!');
				return true;
			} catch {
				console.log('Login failed!');
				return false;
			}
		}
	
		while (!(await sendLogin())) {
				console.log('Trying login...');
				await page.reload();
		}
		
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		
		console.log('Monitoring connection status...');
        setInterval(async () => {
            try {
				await page.goto(extensionUrl , {waitUntil: "networkidle2", timeout: 0});
				await new Promise((_func) => setTimeout(_func, 5000));
				const isLoginHidden = await page.$eval('#login-container', (element) => {
				  return window.getComputedStyle(element).display === 'none';
				});
				
				const isStatusHidden = await page.$eval('#test-container', (element) => {
				  return window.getComputedStyle(element).display === 'none';
				});
				
				const status = await page.evaluate(() => {
						return document.querySelector('.status-text').textContent.trim();
				});
				
                if (isLoginHidden && status == 'Good') {
                    console.log(`Status: ${status}!`);
					const points = await page.evaluate(() => {
						return document.querySelector('#points').textContent.trim();;
					});
					console.log(`Points: ${points}`);
                } else if (!isLoginHidden && isStatusHidden) {
					console.log('Account is logged out!');
					console.log('Trying login...');
					while (!(await sendLogin())) {
						console.log('Trying login...');
						await page.reload();
					}
					const status = await page.evaluate(() => {
						return document.querySelector('.status-text').textContent.trim();
					});
					console.log(`Status: ${status}!`);
					const points = await page.evaluate(() => {
						return document.querySelector('#points').textContent.trim();;
					});
					console.log(`Points: ${points}`);
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
