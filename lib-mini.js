const puppeteer = require("puppeteer-extra");
const timers = require("node:timers/promises");
const path = require("path");
const axios = require('axios');
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
// puppeteerStealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(puppeteerStealth);
// BLOCKMESH
const BLOCKMESH_EXTENSION_URL = `chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html`;
const GRADIENT_EXTENSION_URL = `chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html`;
const DAWN_EXTENSION_URL = `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp/signin.html`;

const BLOCKMESH_USER_INPUT = `::-p-xpath(//input[@name="email"])`;
const BLOCKMESH_PASS_INPUT = '::-p-xpath(//input[@name="password"])';
const DAWN_USER_INPUT = `::-p-xpath(//input[@name="email"])`;
const DAWN_PASS_INPUT = '::-p-xpath(//input[@name="password"])';
const GRA_USER_INPUT = `::-p-xpath(//input[@placeholder="Enter Email"])`;
const GRA_PASS_INPUT = '::-p-xpath(//input[@type="password"])';

const pathToBlockmesh = path.join(process.cwd(), "blockmesh");
const pathToGradient = path.join(process.cwd(), "grandient");
const pathToDawn = path.join(process.cwd(), "dawn");
const rejectResourceTypes = ['image', 'font'];
const rejectRequestPattern = [];

async function loginBlockmesh({
    user,
    pass
}) {
    const {
        browser,
        page
    } = await loginAndOpenExtension({
        user,
        pass
    }, pathToBlockmesh);
    await page.goto(BLOCKMESH_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    const iframeHandle = await page.waitForSelector("iframe", {
        visible: true
    });
    let frame = await iframeHandle.contentFrame();
    await frame.waitForSelector(BLOCKMESH_USER_INPUT);
    await frame.type(BLOCKMESH_USER_INPUT, user);
    await frame.type(BLOCKMESH_PASS_INPUT, pass);
    await frame.waitForSelector(BLOCKMESH_PASS_INPUT);
    // press enter
    await page.keyboard.press("Enter");
    await blockMeshFrame.waitForSelector(".pulse", {
        timeout: 30000
    });
    console.log(
        `Start Blockmesh extension success for user`,
        user
    );
    return {
        browser,
        page
    };
}

async function loginGradient({
    user,
    pass
}) {
    const {
        browser,
        page
    } = await loginAndOpenExtension({
        user,
        pass
    }, pathToGradient);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (
            !!rejectRequestPattern.find((pattern) => req.url().match(pattern)) || rejectResourceTypes.includes(req.resourceType())
        ) {
            return req.abort();
        }
        return req.continue();
    });
    await page.goto(GRADIENT_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    let page2 = (await browser.pages())[1];
    await page2.setRequestInterception(true);
    page2.on('request', (req) => {
        if (
            !![...rejectRequestPattern, 'https://app.gradient.network/dashboard', 'https://app.gradient.network/favicon.ico'].find((pattern) => req.url().match(pattern)) || [...rejectResourceTypes, 'script', 'stylesheet'].includes(req.resourceType())
        ) {
            return req.abort();
        }
        return req.continue();
    });
    await page2.waitForSelector(GRA_USER_INPUT);
    await page2.type(GRA_USER_INPUT, user);
    await page2.type(GRA_PASS_INPUT, pass);
    await page2.waitForSelector(GRA_PASS_INPUT);
    // press enter
    await page2.keyboard.press("Enter");
    await new Promise(_func => setTimeout(_func, 5000));
    //await page2.waitForSelector('::-p-xpath(//a[@href="/dashboard/setting"])');
    let exists = false;
    try {
        await page2.waitForSelector(GRA_PASS_INPUT, {
            timeout: 2000
        });
        exists = true;
    } catch (e) {}
    if (exists) {
        throw new Error('Login failed');
    } else {
        console.log('Logged in successfully!');
    }
    await page2.close();
    await page.reload();
    await new Promise(_func => setTimeout(_func, 5000));
    await page.click('button');
    await new Promise(_func => setTimeout(_func, 10000));
    await page.reload();
    console.log('Extension is activated!');
    const page3 = await browser.newPage();
    page.close();
    return {
        browser,
        page: page3
    };
}

const signInWithPassword =	async (user, pass, key) => {
		const url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + key;

		const headers = {
			"authority": "identitytoolkit.googleapis.com",
			"method": "POST",
			"path": "/v1/accounts:signInWithPassword?key=AIzaSyCWz-svq_InWzV9WaE3ez4XqxCE0C34ddI",
			"scheme": "https",
			"accept": "*/*",
			"accept-encoding": "gzip, deflate, br, zstd",
			"accept-language": "en-US,en;q=0.9,vi;q=0.8",
			"origin": "https://app.gradient.network",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
			"Content-Type": "application/json"
		};

		const data = {
			"returnSecureToken": true,
			"email": user,
			"password": pass,
			"clientType": "CLIENT_TYPE_WEB"
		};

		try {
			const response = await axios.post(url, data, { headers });
			return {
				accessToken: response.data.idToken,
				uid: response.data.localId,
				refreshToken: response.data.refreshToken
			}
		} catch (error) {
			console.error("Error:", error.response ? error.response.data : error.message);
			throw error;
		}
}


async function gradientWithoutLogin({
    user,
    pass,
	key
}) {
    const {
        browser,
        page
    } = await loginAndOpenExtension({
        user,
        pass
    }, pathToGradient);
    page.close();
    const page2 = await browser.newPage();
	await page2.setRequestInterception(true);
    page2.on('request', (req) => {
        if (
            !!rejectRequestPattern.find((pattern) => req.url().match(pattern)) || [...rejectResourceTypes, 'script', 'stylesheet', 'other'].includes(req.resourceType())
        ) {
            return req.abort();
        }
        return req.continue();
    });
	
    await page2.goto('https://app.gradient.network/', {
        timeout: 10000
    });

    const tokenData = await signInWithPassword(user, pass, key);

    await page2.evaluate((data) => {
        try {
            const extensionId = "caacbgbklghmpodbdafajbgdnegacfmo";
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                if (data && data.accessToken) {
                    console.log("sending ChromeEx...", data.accessToken.slice(-4));

                    // Simulate sending a login message to the extension
                    chrome.runtime.sendMessage(extensionId, {
                        action: "login",
                        data: {
                            token: data.accessToken,
                            uid: data.uid,
                            refresh: data.refreshToken
                        }
                    }, response => {
                        console.log(response);
                    });
                } else {
                    // Simulate sending a logout message to the extension
                    chrome.runtime.sendMessage(extensionId, {
                        action: "logout"
                    }, response => {
                        console.log(response);
                    });
                }
            } else {
                console.log("non-chrome env");
            }
        } catch (error) {
            console.log("send ChromeEx Token Message error", error);
        }
    }, tokenData);
	page2.close();
	await new Promise(_func => setTimeout(_func, 1000));
	await (await browser.pages())[0].goto('https://app.gradient.network/', {
        timeout: 10000
    });
	(await browser.pages())[0].close();
	const page3 = await browser.newPage();
	console.log('Logged in successfully!');
    console.log('Extension is activated!');
    return {
        browser,
        page: page3
    };
}


async function reloginGradient({
    user,
    pass
}, page, browser) {
    await page.goto('https://app.gradient.network', {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    await page.waitForSelector(GRA_USER_INPUT);
    await page.type(GRA_USER_INPUT, user);
    await page.type(GRA_PASS_INPUT, pass);
    await page.waitForSelector(GRA_PASS_INPUT);
    // press enter
    await page.keyboard.press("Enter");
    await new Promise(_func => setTimeout(_func, 5000));
    //await page.waitForSelector('::-p-xpath(//a[@href="/dashboard/setting"])');
    let exists = false;
    try {
        await page.waitForSelector(GRA_PASS_INPUT, {
            timeout: 2000
        });
        exists = true;
    } catch (e) {}
    if (exists) {
        throw new Error('Login failed');
    } else {
        console.log('Logged in successfully!');
    }
    await page.goto(GRADIENT_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    await new Promise(_func => setTimeout(_func, 5000));
    const button = await page.$('button');
    if (button) {
        await button.click();
    }
    await new Promise(_func => setTimeout(_func, 10000));
    await page.reload();
    console.log('Extension is activated!');
    return page;
}

async function loginDawn({
    user,
    pass
}) {
    const {
        browser,
        page
    } = await loginAndOpenExtension({
        user,
        pass
    }, pathToDawn);
    const page2 = await browser.newPage();
    await page2.goto(DAWN_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    await page2.waitForSelector(DAWN_USER_INPUT);
    await page2.type(DAWN_USER_INPUT, user);
    await page2.type(DAWN_PASS_INPUT, pass);
    await page2.waitForSelector(DAWN_PASS_INPUT);
    // press enter
    await page2.keyboard.press("Enter");
    console.log(
        `Start Gradient extension success for user`,
        user
    );
    return {
        browser,
        page
    };
}

async function loginAndOpenExtension(user, path) {
    let proxyHost, proxyPort, proxyUser, proxyPass;

    if (user.proxy) {
        [proxyHost, proxyPort, proxyUser, proxyPass] = user.proxy.split(":");
    }

    args = [
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
        `--disable-extensions-except=${path}`,
        `--load-extension=${path}`,
        "--window-size=360,600"
    ];

    if (proxyHost) {
        args.push(`--proxy-server=http://${proxyHost}:${proxyPort}`);
    }

    let browser = await puppeteer.launch({
        headless: true,
        args,
        // defaultViewport: {width: 800, height: 600, deviceScaleFactor: 2},
        // targetFilter: (target) => target.type() !== "other", // Anh huong den iframe
    });
	
	//await new Promise(_func => setTimeout(_func, 10000000));

    const page = (await browser.pages())[0]; // <-- bypasses Cloudflare
    await page.setUserAgent(
        `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0`
    );

    if (proxyUser) {
        await page.authenticate({
            username: proxyUser,
            password: proxyPass,
        });
    }
	
    return {
        browser,
        page
    };
}

const getBlockmeshStatus = async (page, user) => {
    try {
        let frame = await getFrame(page);
        await frame.waitForSelector(".pulse", {
            timeout: 5000
        });
        return true;
    } catch (error) {
        console.log("🚀 ~ getBlockmeshStatus ~ error:", error);
        return false;
    }
};

const printStats = async (page) => {
	let element3 = await page.$('::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div)');
	let value3 = await page.evaluate(el => el.textContent, element3);
	let element = await page.$('::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1])');
	let element2 = await page.$('::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1])');
	let value = await page.evaluate(el => el.textContent, element);
	let value2 = await page.evaluate(el => el.textContent, element2);
	console.log("Status:", value3);
	console.log(`Today's Taps: ${value2} ; Today's Uptime: ${value}`);
	return value3;
}

const getGraStatus = async (browser, page, user) => {
    try {
        let value3 = 'N/A';
		await page.setRequestInterception(true);
		page.on('request', (req) => {
			if (
				!!rejectRequestPattern.find((pattern) => req.url().match(pattern)) || rejectResourceTypes.includes(req.resourceType())
			) {
				return req.abort();
			}
			return req.continue();
		});
        await page.goto(GRADIENT_EXTENSION_URL);
        await new Promise(_func => setTimeout(_func, 3000));
        await page.waitForSelector(".avatar-container", {
            timeout: 5000
        });
        try {
            value3 = await printStats(page);
            if (value3 && (value3.toLowerCase() == 'diconnected' || value3.toLowerCase() == 'unsupported')) {
                return {
                    status: false,
                    text: value3,
                    page: page
                };
            }
        } catch (error) {
            console.log("🚀 ~ getGraStatus ~ error:", error);
        }
        const page2 = await browser.newPage();
        page.close();
        return {
            status: true,
            text: value3,
            page: page2
        };
    } catch (error) {
        console.log("Status: ", 'Diconnected');
        return {
            status: false,
            text: 'Diconnected',
            page: page
        };
    }
};

const saveScreenshot = async (page, user) => {
    try {
        await page.screenshot({
            path: `./images/${user?.id}.png`
        });
    } catch (error) {
        console.log("🚀 ~ constsaveScreenshot ~ error:", error);
    }
};
const getFrame = async (page) => {
    const iframeHandle = await page.waitForSelector("iframe", {
        visible: true,
        timeout: 5000,
    });
    return await iframeHandle.contentFrame();
};

module.exports = {
    loginAndOpenExtension,
    loginBlockmesh,
    loginDawn,
    loginGradient,
    getBlockmeshStatus,
    saveScreenshot,
    getFrame,
    getGraStatus,
    reloginGradient,
    gradientWithoutLogin,
	printStats
};