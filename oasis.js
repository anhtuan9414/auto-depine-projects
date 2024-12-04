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

const generateUniqueName = (prefix = "name") => {
  const timestamp = Date.now(); // Current time in milliseconds
  const randomPart = Math.random().toString(36).substring(2, 8); // Random alphanumeric string
  return `${prefix}_${timestamp}_${randomPart}`;
}

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const extensionId = 'knhbjeinoabfecakfppapfgdhcpnekmm';
    const extensionUrl = `chrome-extension://${extensionId}/index.html`;

	const pathTo = path.join(process.cwd(), "oasis");
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
        `--disable-extensions-except=${pathTo}`,
        `--load-extension=${pathTo}`,
        '--window-size=1024,768',
    ];

    let browser, page;

    try {
		let failed = 0;
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = await browser.newPage();
		(await browser.pages())[0].close();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        console.log(`Navigating to ${extensionUrl} ...`);
        await page.goto(extensionUrl , {waitUntil: "networkidle2"});
		
		const sendLogin = async () => {
			try {
				await new Promise((_func) => setTimeout(_func, 3000));
				await page.waitForSelector('button[type="button"]');
				await page.click('button[type="button"]');
				await new Promise((_func) => setTimeout(_func, 2000));
				let newPage = (await browser.pages())[1];
				// Wait for the login form to load
				await newPage.waitForSelector('input[name="email"]', { timeout: 10000 });
				await newPage.waitForSelector('input[name="password"]');
				await newPage.type('input[name="email"]', process.env.OASIS_USERNAME, { delay: 50 }); // Simulate typing
				await newPage.type('input[name="password"]', process.env.OASIS_PASSWORD, { delay: 50 });

				// Click the login button
				await newPage.click('button[type="submit"]');
				await newPage.waitForSelector("::-p-xpath(//*[text()='Statistics'])");
				newPage.close();
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
				await new Promise((_func) => setTimeout(_func, 5000));
		}
		
		const connectNode = async () => {
			try {
				console.log('Start connect node!');
				await page.reload();
				await page.waitForSelector('button[type="button"]');
				await page.click('button[type="button"]');
				await new Promise((_func) => setTimeout(_func, 2000));
				let newPage = (await browser.pages())[1];
				await newPage.waitForSelector('input[name="name"]', { timeout: 10000 });
				let deviceName = generateUniqueName('Device');
				if (process.env.IP) {
					deviceName = process.env.IP;
				}
				console.log('Enter device name:', deviceName);
				await newPage.type('input[name="name"]', deviceName, { delay: 50 });
				await newPage.click('button[type="submit"]');
				await newPage.waitForSelector("::-p-xpath(//*[text()='Provider Dashboard'])");
				console.log(`Connect ${deviceName} successful!`);
				newPage.close();
				await page.reload();
				return true;
			} catch (err) {
				console.log('Connect node failed!');
				if (failed >= 5) {
					throw err;
				}
				++failed;
				return false;
			}
		}
		
		while (!(await connectNode())) {
				console.log('Trying connect node...');
				await new Promise((_func) => setTimeout(_func, 5000));
		}
		
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		
		console.log('Monitoring connection status...');
		failed = 0;
        setInterval(async () => {
            try {
				await page.goto(extensionUrl , {waitUntil: "networkidle2"});
				 if (await waitForElementExists(page, "::-p-xpath(//*[text()='View on Dashboard'])")) {
					 console.log(new Date(), `Status: Connected!`);
					 const rs = await page.evaluate(() => {
						const elements = document.querySelectorAll('#root > div > div > div.m_6d731127.mantine-Stack-root > div.m_4081bf90.mantine-Group-root.m_1b7284a3.mantine-Paper-root div');
						const rs = {};
		
						for (let i = 0; i < elements.length; i++) {
							if (!elements[i].querySelector('h4') || !elements[i].querySelector('p')) {
								continue;
							}
							const name = elements[i].querySelector('p').textContent.trim();
							const value = elements[i].querySelector('h4').textContent.trim();
							rs[name] = value;
						}
						return rs;
					});
					Object.keys(rs).forEach(key => {
						console.log(key + ':', rs[key]);
					})
				 } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Sign In'])")) {
					console.log(new Date(), 'Account is logged out!');
					console.log(new Date(), 'Trying login...');
					while (!(await sendLogin())) {
						console.log(new Date(), 'Trying login...');
						await page.reload();
						await new Promise((_func) => setTimeout(_func, 5000));
					}
					while (!(await connectNode())) {
						console.log('Trying connect node...');
						await new Promise((_func) => setTimeout(_func, 5000));
					}
					console.log(new Date(), `Status: Connected!`);
				 } else {
					 console.error(new Date(), "Status: Unknown!");
				 }
				 failed = 0;
            } catch (err) {
                console.error(new Date(), 'Error refreshing page:', err);
				if (failed >= 5) {
					throw err;
				}
				++failed;
            }
			const page2 = await browser.newPage();
			page.close();
			page = page2;
        }, 600000);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
