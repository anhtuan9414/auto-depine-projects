const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
puppeteer.use(StealthPlugin());
const path = require('path');
const TwoCaptcha = require("@2captcha/captcha-solver")
const solver = new TwoCaptcha.Solver(process.env.CAPTCHA_KEY)

const waitForElementExists = async (page, selector, timeout = 10000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

const isBase64ImageJpeg = (data) => {
  // Check if the string starts with the proper prefix
  const jpegPrefix = /^data:image\/jpeg;base64,/;
  if (!jpegPrefix.test(data)) {
    return false;
  }

  // Extract the Base64 content after the prefix
  const base64Content = data.replace(jpegPrefix, '');

  // Check if the remaining string is valid Base64
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Content.length % 4 === 0 && base64Regex.test(base64Content);
}

const run = async () => {
    //setupLogging();
    const secUntilRestart = 60;
    console.log(`Started the script`);

    const extensionId = 'fpdkjdnhkakefebpekbdhillbhonfjjp';
    const extensionUrl = `chrome-extension://${extensionId}/dashboard.html`;

	const pathTo = path.join(process.cwd(), "dawn");
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
	let failed = 0;
    try {
        browser = await puppeteer.launch({ headless: true, args: browserArgs });
        page = await browser.newPage();
		(await browser.pages())[0].close();
		
        const setPagaInfo = async () => {
			await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
			);
			
			const balance = await solver.balance();
			
			console.log(`2captcha balance: ${balance}$`);

			  page.on('dialog', async (dialog) => {
				if (dialog.type() === 'alert') {
				  alertAppeared = true;
				  await dialog.accept(); // Close the alert by clicking "OK"
				}
			  });
			  
								  // Enable request interception
			await page.setRequestInterception(true);

			
			page.on('request', (request) => {
			  const url = request.url();

			  if (url.includes('appid')) {
				const parsedUrl = new URL(url);
				parsedUrl.searchParams.set('appid', '67505b5f0b661926f10f4322'); // Set or modify appid
				request.continue({
				  url: parsedUrl.toString(),
				});
			  } else {
				request.continue();
			  }
			});
		}

		await setPagaInfo();
        console.log(`Navigating to ${extensionUrl} ...`);
        await page.goto(extensionUrl , {waitUntil: "networkidle2"});
		await new Promise((_func) => setTimeout(_func, 5000));
		
		const sendLogin = async () => {
			try {
				await new Promise((_func) => setTimeout(_func, 3000));
				await page.waitForSelector('input[name="email"]', { timeout: 10000 });
				await page.waitForSelector('input[name="password"]');
				await page.type('input[name="email"]', process.env.DAWN_USERNAME, { delay: 50 }); // Simulate typing
				await page.type('input[name="password"]', process.env.DAWN_PASSWORD, { delay: 50 });
				
				
				await page.waitForSelector("img#puzzleImage");
				const imageSrc = await page.$eval('img#puzzleImage', (img) => img.src);
				
				if (!isBase64ImageJpeg(imageSrc)) {
					throw 'Incorrect captcha image';
				}

				await page.waitForSelector("#puzzelAns");
				console.log('Calling 2captcha API...');
				const { status, data } = await solver.imageCaptcha({
					body: imageSrc,
					numeric: 4,
					min_len: 5,
					max_len: 5
				});
				
				if (status < 1) {
					throw 'Solve captcha failed';
				}
				
				console.log('Text captcha:', data);
				await page.type('#puzzelAns', data);
				await page.click('#loginButton');
				if (await waitForElementExists(page, "::-p-xpath(//*[text()='Incorrect answer. Try again!'])")) {
					console.log('Incorrect answer!');
					throw new Error('Incorrect answer!');
				}
				await page.waitForSelector("a[href='dashboard.html']");
				console.log('Login successful!');
				return true;
			} catch (err){
				console.log('Login failed!', err.message);
				return false;
			}
		}
	
		while (!(await sendLogin())) {
				console.log('Trying login...');
				await page.reload();
				await new Promise((_func) => setTimeout(_func, 7000));
		}
		
		
		const page2 = await browser.newPage();
		page.close();
		page = page2;
		failed = 0;
		console.log('Monitoring connection status...');
        setInterval(async () => {
            try {
				await setPagaInfo();
				await page.goto(extensionUrl , {waitUntil: "networkidle2"});
				await new Promise((_func) => setTimeout(_func, 5000));
				
				 if (await waitForElementExists(page, "a[href='dashboard.html']")) {
					const status = await page.evaluate(() => {
						return document.querySelector('#isnetworkconnected').textContent.trim();
					});
					console.log(new Date(), `Status: ${status}!`);
					const rs = await page.evaluate(() => {
						const elements = document.querySelectorAll('.quality-box .dash-new-box');
						const rs = {};
		
						for (let i = 0; i < elements.length; i++) {
							if (!elements[i].querySelector('h6') || !elements[i].querySelector('h5')) {
								continue;
							}
							const name = elements[i].querySelector('h6').textContent.trim();
							const value = elements[i].querySelector('h5').textContent.trim();
							rs[name] = value;
						}
						return rs;
					});
					Object.keys(rs).forEach(key => {
						console.log(key + ':', rs[key]);
					})
				 } else if (await waitForElementExists(page, `::-p-xpath(//input[@name="email"])`)) {
					console.log(new Date(), 'Account is logged out!');
					console.log(new Date(), 'Trying login...');
					while (!(await sendLogin())) {
						console.log(new Date(), 'Trying login...');
						await page.reload();
						await new Promise((_func) => setTimeout(_func, 7000));
					}
					const status = await page.evaluate(() => {
						return document.querySelector('#isnetworkconnected').textContent.trim();
					});
					console.log(new Date(), `Status: ${status}!`);
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
        }, 600000);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (browser) await browser.close();
        console.log(`Restarting in ${secUntilRestart} seconds...`);
        setTimeout(run, secUntilRestart * 1000);
    }
};

run();
