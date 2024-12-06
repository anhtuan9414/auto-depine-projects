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
    const secUntilRestart = 60;
	let failed = 0;
    console.log(`Started the script`);

    const extensionId = 'mmlnljdcfjnfeikeioghbkobdcmnhgko';
    const extensionUrl = `chrome-extension://${extensionId}/popup/popup.html`;

	const pathToTeoneo = path.join(process.cwd(), "kaisar");
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
        await page.goto(extensionUrl , {waitUntil: "networkidle2"});
		
		const conncetNode = async () => {
			if (await waitForElementExists(page, "::-p-xpath(//*[text()='Login'])")) {
				await page.waitForSelector("::-p-xpath(//*[text()='Login'])", { timeout: 10000 });
				console.log('Clicking the extension Login button...');
				await page.click("::-p-xpath(//*[text()='Login'])");
				await new Promise((_func) => setTimeout(_func, 5000));
				page = (await browser.pages())[1];
			}
			
			const sendLogin = async () => {
				try {
					// Wait for the login form to load
					await page.waitForSelector('input#username', { timeout: 30000 });
					await page.waitForSelector('input#password');
					await page.type('input#username', process.env.KAISAR_USERNAME, { delay: 50 }); // Simulate typing
					await page.type('input#password', process.env.KAISAR_PASSWORD, { delay: 50 });

					// Click the login button
					await page.keyboard.press("Enter");
					await page.waitForSelector("::-p-xpath(//*[text()='Dashboard'])");
					page = (await browser.pages())[0];
					(await browser.pages())[1].close();
					await page.reload();
					await page.waitForSelector('.point-status');
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
					await new Promise((_func) => setTimeout(_func, 3000));
			}
			
			await new Promise((_func) => setTimeout(_func, 5000));
			await page.waitForSelector('button');
			const result = await page.evaluate(() => {
			  const textButton = document.querySelector('button').textContent.trim();
			  return { startButtonExists: textButton.includes('Start'), textButton };
			});
			
			if (result.startButtonExists) {
				console.log('Click start mining!');
				await page.click('button');
			}
		}
		
		await conncetNode();
		
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		failed = 0;
		console.log('Monitoring connection status...');
		
		setInterval(async () => {
            try {
				await page.goto(extensionUrl , {waitUntil: "networkidle2"});
				await new Promise((_func) => setTimeout(_func, 10000));
				
				 if (await waitForElementExists(page, ".point-container")) {
					await page.waitForSelector('button');
					
					const result = await page.evaluate(() => {
					  const textButton = document.querySelector('button').textContent.trim();
					  return { startButtonExists: textButton.includes('Start'), textButton };
					});
					
					if (result.startButtonExists) {
						console.log('Click start mining!');
						await page.click('button');
						await new Promise((_func) => setTimeout(_func, 5000));
					}
					
					const result = await page.evaluate(() => {
					  const farmingButtonExists = document.querySelector('button.farming') !== null;
					  const textButton = document.querySelector('button').textContent.trim();
					  return { farmingButtonExists, claimButtonExists: textButton.includes('Claim'), textButton };
					});
					
					if (!result.farmingButtonExists || result.claimButtonExists) {
						await page.click('button');
						console.log(new Date(), result.textButton.replace(/\s+/g, ' ').trim());
						await new Promise((_func) => setTimeout(_func, 10000));
					}
					
					const status = await page.evaluate(() => {
						return document.querySelector('div.mining > div.loged-header.mb-10 > div > div.login-status.d-flex.justify-center.align-center.gap-5 > p.text-white.fs-12.fw-400').textContent.trim();
					});
					const points = await page.evaluate(() => {
						return document.querySelector('.point-container .point-text').textContent.trim();
					});
					
					const farming = await page.evaluate(() => {
						return document.querySelector('button').textContent.trim();
					});
					
					console.log(new Date(), `Status: ${status}!`);
					console.log(`Total Points: ${points}`);
					console.log(`${farming.replace(/\s+/g, ' ').trim()}!`);
				 } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Login'])")) {
					console.log(new Date(), 'Account is logged out!');
					console.log(new Date(), 'Trying login...');
					await conncetNode();
					await new Promise((_func) => setTimeout(_func, 10000));
					await page.waitForSelector('button');
					
					const result = await page.evaluate(() => {
					  const textButton = document.querySelector('button').textContent.trim();
					  return { startButtonExists: textButton.includes('Start'), textButton };
					});
					
					if (result.startButtonExists) {
						console.log('Click start mining!');
						await page.click('button');
						await new Promise((_func) => setTimeout(_func, 5000));
					}
					
					const result = await page.evaluate(() => {
					  const farmingButtonExists = document.querySelector('button.farming') !== null;
					  const textButton = document.querySelector('button').textContent.trim();
					  return { farmingButtonExists, claimButtonExists: textButton.includes('Claim'), textButton };
					});
					
					if (!result.farmingButtonExists || result.claimButtonExists) {
						await page.click('button');
						console.log(new Date(), result.textButton.replace(/\s+/g, ' ').trim());
						await new Promise((_func) => setTimeout(_func, 10000));
					}
					
					const status = await page.evaluate(() => {
						return document.querySelector('div.mining > div.loged-header.mb-10 > div > div.login-status.d-flex.justify-center.align-center.gap-5 > p.text-white.fs-12.fw-400').textContent.trim();
					});
					const points = await page.evaluate(() => {
						return document.querySelector('.point-container .point-text').textContent.trim();
					});
					
					const farming = await page.evaluate(() => {
						return document.querySelector('button').textContent.trim();
					});
					
					console.log(new Date(), `Status: ${status}!`);
					console.log(`Total Points: ${points}`);
					console.log(`${farming.replace(/\s+/g, ' ').trim()}!`);
				 } else {
					 console.error(new Date(), "Status: Unknown!");
				 }
				 failed = 0;
            } catch (err) {
                console.error(new Date(), 'Error refreshing page:', err);
				if (failed >= 10) {
					throw err;
				}
				++failed;
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
