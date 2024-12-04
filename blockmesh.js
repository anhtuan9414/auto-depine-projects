const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
const path = require('path');

const waitForElementExists = async (frame, selector, timeout = 10000) => {
    try {
        await frame.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const extensionId = 'obfhoiefijlolgdmphcekifedagnkfjp';
    const extensionUrl = `chrome-extension://${extensionId}/js/popup.html`;

	const pathTo = path.join(process.cwd(), "blockmesh");
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
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = (await browser.pages())[0];
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        console.log(`Navigating to ${extensionUrl} ...`);
        await page.goto(extensionUrl , {waitUntil: "networkidle2"});
		
		
		const sendLogin = async () => {
			try {
				await new Promise((_func) => setTimeout(_func, 3000));
				const iframeHandle = await page.waitForSelector("iframe", {
					visible: true,
				});
				let frame = await iframeHandle.contentFrame();
				await frame.waitForSelector(`::-p-xpath(//input[@name="email"])`);
				await frame.type(`::-p-xpath(//input[@name="email"])`, process.env.BLOCKMESH_USERNAME);
				await frame.type('::-p-xpath(//input[@name="password"])', process.env.BLOCKMESH_PASSWORD);
				await frame.waitForSelector('::-p-xpath(//input[@name="password"])');
				// press enter
				await page.keyboard.press("Enter");
				await frame.waitForSelector("::-p-xpath(//*[text()='Dashboard'])", { timeout: 30000 });
				console.log('Login successful!');
				return true;
			} catch (e){
				console.log('Login failed!', e);
				return false;
			}
		}
	
		while (!(await sendLogin())) {
				console.log('Trying login...');
				await page.reload();
				await new Promise((_func) => setTimeout(_func, 10000));
		}
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		
		console.log('Monitoring connection status...');
        setInterval(async () => {
            try {
				await page.goto(extensionUrl , {waitUntil: "networkidle2"});
				const iframeHandle = await page.waitForSelector("iframe", {
					visible: true,
				});
				let frame = await iframeHandle.contentFrame();
				 if (await waitForElementExists(frame, "::-p-xpath(//*[text()='Dashboard'])")) {
					 console.log(new Date(), `Status: Connected!`);
				 } else if (await waitForElementExists(frame, `::-p-xpath(//input[@name="email"])`)) {
					console.log(new Date(), 'Account is logged out!');
					console.log(new Date(), 'Trying login...');
					while (!(await sendLogin())) {
						console.log(new Date(), 'Trying login...');
						await page.reload();
						await new Promise((_func) => setTimeout(_func, 10000));
					}
					console.log(new Date(), `Status: Connected!`);
				 } else {
					 console.error(new Date(), "Status: Unknown!");
				 }
            } catch (err) {
                console.error(new Date(), 'Error refreshing page:', err);
            }
			const page2 = await browser.newPage();
			page.close();
			page = page2;
        }, 300000);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
