const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
const path = require('path');
const fs = require('fs');
const axios = require('axios');

let nodeId = 'N/A';

const log = (text, ...value) => {
	console.log(new Date(), text, ...value);
}

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
			log("Extension is unchecked!");
			await page.click('button[data-state="unchecked"]');
		}
        await page.waitForSelector('button[data-state="checked"]', { timeout: 10000 });
        log("Extension is checked!");
    } catch {
        log("Failed to find 'checked' element. Extension activation failed.");
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
    log("Your token can be used to log in for 7 days.");
};

const removeNode = async (nodeId, token) => {
	try {
		await axios.post(
		  `https://gateway-run.bls.dev/api/v1/nodes/${nodeId}/retire`, 
		  {},
		  {
			headers: {
			  accept: "*/*",
			  "accept-language": "en-US,en;q=0.9",
			  authorization: `Bearer ${token}`,
			  "content-type": "application/json",
			  priority: "u=1, i",
			  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36",
			  "sec-fetch-dest": "empty",
			  "sec-fetch-mode": "cors",
			  "sec-fetch-site": "cross-site",
			  Referer: "https://bless.network/",
			  "Referrer-Policy": "strict-origin-when-cross-origin"
			}
		  }
		);
		log("Retire Node ID successfully: ", nodeId);
	} catch (e){
		log("Retire Node ID failed: ", nodeId);
	}
}

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    log(`Started the script`);

    const cookie = process.env.BLESS_TOKEN;
    const extensionId = 'pljbjcehnhcnofmkdbjolghdcjnmekia';
    const extensionUrl = `chrome-extension://${extensionId}/index.html`;

    if (!cookie) {
        log('No cookie provided. Please set the B7S_AUTH_TOKEN environment variable.');
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
	let failed = 0;

    try {
		let fileExists = fs.existsSync('blessData.json');
		if (fileExists) {
			const fileContent = fs.readFileSync('blessData.json');
			const jsonData = JSON.parse(fileContent);
			if (jsonData.nodeId) {
				await removeNode(jsonData.nodeId, cookie);
			}
		}
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = await browser.newPage();
		
		 const setPagaInfo = async () => {
			await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
			);
			
			await page.setRequestInterception(true);
			page.on('request', (request) => {
			  if (
				request
					.url()
					.includes("https://gateway-run.bls.dev/api/v1/nodes") &&
				request.method() === "GET"
				) {
					try {
						const match = request.url().match(/nodes\/([^\/]+)/);
						const newNodeId = match ? match[1] : "N/A";
						if (newNodeId != nodeId) {
							nodeId = newNodeId;
							log("Get Node ID:", nodeId);
						}
					} catch (error) {}
				}
				request.continue();
			});
		}
		
        await setPagaInfo();

        log(`Navigating to https://bless.network/dashboard website...`);
        await page.goto('https://bless.network/dashboard', { waitUntil: "load", timeout: 0 });

        await addCookieToLocalStorage(page, cookie);

        while (!(await waitForElementExists(page, "::-p-xpath(//*[text()='Connected'])"))) {
            log(`Refreshing to check login...`);
            await page.goto('https://bless.network/dashboard', { timeout: 0 });
        }
		
        log('Logged in successfully!');

        await page.goto(extensionUrl, {timeout: 0});
        while (await waitForElementExists(page, "::-p-xpath(//*[text()='Log in'])")) {
            log('Clicking the extension login button...');
            await page.click("::-p-xpath(//*[text()='Log in'])");
			await new Promise((_func) => setTimeout(_func, 10000));
            await page.reload();
        }
		
        //await checkActiveElement(page);
		
		try {
		  const jsonData = JSON.stringify({ nodeId: nodeId, token: cookie }, null, 2)
		  fs.writeFileSync('blessData.json', jsonData, 'utf8');
		  log('Save bless data file successfully!');
		} catch (err) {
		  log('Error save bless data file:', err);
		}

		const page2 = await browser.newPage();
		page.close();
		page = page2;
		failed = 0;
        log('Monitoring connection status...');
        setInterval(async () => {
			let restart = false;
            try {
				await setPagaInfo();
                await page.goto(extensionUrl , {waitUntil: "load", timeout: 0});
				await new Promise((_func) => setTimeout(_func, 10000));
                if (await waitForElementExists(page, "::-p-xpath(//*[text()='Online'])")) {
                    log("Status: Online");
					console.log(`Node ID: ${nodeId}`);
					const rs = await page.evaluate(() => {
						const elements = document.querySelectorAll('#root > div.overflow-hidden > div.flex.flex-col.items-center.justify-between.h-full > div:nth-child(1) div');
						const elementCenter1 = document.querySelector('#root > div.overflow-hidden > div.flex.flex-col.items-center.justify-between.h-full > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)').textContent.trim();
						const elementCenter2 = document.querySelector('#root > div.overflow-hidden > div.flex.flex-col.items-center.justify-between.h-full > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)').textContent.trim();
						const cpu = document.querySelector('div[title="CPU Usage"]');;
						const ram = document.querySelector('div[title="Memory Usage"]');
						const rs = {};
		
						for (let i = 0; i < elements.length; i++) {
							if (!elements[i].querySelector('div:nth-child(1)') || !elements[i].querySelector('div:nth-child(2)')) {
								continue;
							}
							const name = elements[i].querySelector('div:nth-child(1)').textContent.trim();
							const value = elements[i].querySelector('div:nth-child(2)').textContent.trim();
							rs[name] = value;
						}
						return {...rs, [elementCenter1]: elementCenter2, 'CPU Usage': cpu.textContent.trim(), 'Memory Usage': ram.textContent.trim()};
					});
					Object.keys(rs).forEach(key => {
						console.log(key + ':', rs[key]);
					})
                } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Offline'])")) {
                    log("Status: Offline");
					log(`Node ID: ${nodeId}`);
					//await checkActiveElement(page);
                } else if (await waitForElementExists(page, "::-p-xpath(//*[text()='Log in'])")) {
					log("Account logout!");
					log('Clicking the extension login button...');
					await page.click("::-p-xpath(//*[text()='Log in'])");
					await new Promise((_func) => setTimeout(_func, 10000));
					if((await browser.pages())[1]) {
						(await browser.pages())[1].close();
					}
					await page.reload();
					await new Promise((_func) => setTimeout(_func, 5000));
					if (!await waitForElementExists(page, "::-p-xpath(//*[text()='Online'])")) {
						restart = true;
					}
				} else {
                    log("Status: Unknown!");
					restart = true;
                }
				failed = 0;
            } catch (err) {
                log('Error refreshing page:', err);
            }
			
			if (restart) {
				throw "Force restart node";
			}
			
			const page2 = await browser.newPage();
			page.close();
			page = page2;
        }, 3600000);
    } catch (err) {
        log(`Error: ${err.message}`);
        if (browser) await browser.close();
        log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
