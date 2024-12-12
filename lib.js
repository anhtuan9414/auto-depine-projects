const puppeteer = require("puppeteer-extra");
const timers = require("node:timers/promises");
const path = require("path");
const axios = require("axios");
const _ = require("lodash");
const userA = require('./user-agents-gs.json');
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
const pathToGradient = path.join(process.cwd(), "gradient");
const pathToDawn = path.join(process.cwd(), "dawn");
const rejectResourceTypes = ["image", "font"];
const rejectRequestPattern = [];
let tokenData;
let nodeId = "N/A";
let userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36';

async function loginBlockmesh({ user, pass }) {
    const { browser, page } = await loginAndOpenExtension(
        { user, pass },
        pathToBlockmesh,
    );
    await page.goto(BLOCKMESH_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    const iframeHandle = await page.waitForSelector("iframe", {
        visible: true,
    });
    let frame = await iframeHandle.contentFrame();
    await frame.waitForSelector(BLOCKMESH_USER_INPUT);
    await frame.type(BLOCKMESH_USER_INPUT, user);
    await frame.type(BLOCKMESH_PASS_INPUT, pass);
    await frame.waitForSelector(BLOCKMESH_PASS_INPUT);
    // press enter
    await page.keyboard.press("Enter");
    await blockMeshFrame.waitForSelector(".pulse", { timeout: 30000 });
    console.log(`Start Blockmesh extension success for user`, user);
    return { browser, page };
}

async function loginGradient({ user, pass }) {
    const { browser, page } = await loginAndOpenExtension(
        { user, pass },
        pathToGradient,
    );
    await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (
            !!rejectRequestPattern.find((pattern) =>
                req.url().match(pattern),
            ) ||
            rejectResourceTypes.includes(req.resourceType())
        ) {
            return req.abort();
        }
        if (
            req
                .url()
                .includes("https://api.gradient.network/api/sentrynode/get") &&
            req.method() === "GET"
        ) {
            try {
                const match = req.url().match(/\/([^\/]+)$/);
                const newNodeId = match ? match[1] : "N/A";
				if (newNodeId != nodeId) {
					nodeId = newNodeId;
					console.log("Get Node ID:", nodeId);
				}
            } catch (error) {}
        }
        return req.continue();
    });
    await page.goto(GRADIENT_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    let page2 = (await browser.pages())[1];
	await page2.setUserAgent(userAgent);
    console.log("Go to", "https://app.gradient.network");
    await page2.setRequestInterception(true);
    page2.on("request", (req) => {
       if (
            !![
                ...rejectRequestPattern,
                "https://app.gradient.network/dashboard",
                "https://app.gradient.network/favicon.ico",
            ].find((pattern) => req.url().match(pattern)) ||
            [...rejectResourceTypes, "script", "stylesheet"].includes(
                req.resourceType(),
            )
        ) {
            return req.abort();
        }
        return req.continue();
    });

    page2.on("response", async (response) => {
        if (
            response
                .url()
                .includes(
                    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
                )
        ) {
            try {
                const data = await response.json();
                tokenData = {
                    accessToken: data.idToken,
                    uid: data.localId,
                    refreshToken: data.refreshToken,
                };
                console.log("Get token: ...", tokenData.accessToken.slice(-4));
            } catch (error) {}
        }
    });
    await page2.waitForSelector(GRA_USER_INPUT);
    await page2.type(GRA_USER_INPUT, user);
    await page2.type(GRA_PASS_INPUT, pass);
    await page2.waitForSelector(GRA_PASS_INPUT);
    // press enter
    await page2.keyboard.press("Enter");
	await new Promise((_func) => setTimeout(_func, 10000));
    //await page2.waitForSelector('::-p-xpath(//a[@href="/dashboard/setting"])');
    let exists = false;
    try {
        await page2.waitForSelector(GRA_PASS_INPUT, {
            timeout: 5000,
        });
		
		await page2.reload();
		
		await new Promise((_func) => setTimeout(_func, 10000));
		await page2.waitForSelector(GRA_PASS_INPUT, {
            timeout: 5000,
        });
		
        exists = true;
    } catch (e) {}
    if (exists) {
        throw new Error("Login failed");
    } else {
        console.log("Logged in successfully!");
    }
    await page2.close();
    console.log("Go to", "extension page");
    await page.reload();
    await new Promise((_func) => setTimeout(_func, 5000));
    await page.click("button");
    await new Promise((_func) => setTimeout(_func, 10000));
    await page.reload();
    console.log("Extension is activated!");
    const page3 = await browser.newPage();
	//await page3.setUserAgent(userAgent);
    page.close();
    return { browser, page: page3 };
}

const waitForElementExists = async (page, selector, timeout = 10000) => {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch {
        return false;
    }
};

async function reloginGradient({ user, pass }, page, browser) {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (
            !![
                ...rejectRequestPattern,
                "https://app.gradient.network/favicon.ico",
            ].find((pattern) => req.url().match(pattern)) ||
             ([...rejectResourceTypes, "script", "stylesheet"].includes(
                req.resourceType(),
            ) &&
                ["https://app.gradient.network/dashboard"].find((pattern) =>
                    req.url().match(pattern),
                ))
        ) {
            return req.abort();
        }
        return req.continue();
    });
    page.on("response", async (response) => {
        if (
            response
                .url()
                .includes(
                    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
                )
        ) {
            try {
                const data = await response.json();
                tokenData = {
                    accessToken: data.idToken,
                    uid: data.localId,
                    refreshToken: data.refreshToken,
                };
                console.log("Get token: ...", tokenData.accessToken.slice(-4));
            } catch (error) {}
        }
    });
    console.log("Go to", "https://app.gradient.network");
    await page.goto("https://app.gradient.network", {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    await page.waitForSelector(GRA_USER_INPUT);
    await page.type(GRA_USER_INPUT, user);
    await page.type(GRA_PASS_INPUT, pass);
    await page.waitForSelector(GRA_PASS_INPUT);
    // press enter
    await page.keyboard.press("Enter");
     await new Promise((_func) => setTimeout(_func, 10000));
    //await page.waitForSelector('::-p-xpath(//a[@href="/dashboard/setting"])');
    let exists = false;
    try {
        await page2.waitForSelector(GRA_PASS_INPUT, {
            timeout: 5000,
        });
		
		await page2.reload();
		
		await new Promise((_func) => setTimeout(_func, 10000));
		await page2.waitForSelector(GRA_PASS_INPUT, {
            timeout: 5000,
        });
        exists = true;
    } catch (e) {}
    if (exists) {
        throw new Error("Login failed");
    } else {
        console.log("Logged in successfully!");
    }
    const page2 = await browser.newPage();
	await page2.setUserAgent(userAgent);
    await page.close();
    await page2.setRequestInterception(true);
    page2.on("request", (req) => {
        if (
            !!rejectRequestPattern.find((pattern) =>
                req.url().match(pattern),
            ) ||
            rejectResourceTypes.includes(req.resourceType())
        ) {
            return req.abort();
        }
        if (
            req
                .url()
                .includes("https://api.gradient.network/api/sentrynode/get") &&
            req.method() === "GET"
        ) {
            try {
                const match = req.url().match(/\/([^\/]+)$/);
                const newNodeId = match ? match[1] : "N/A";
				if (newNodeId != nodeId) {
					nodeId = newNodeId;
					console.log("Get Node ID:", nodeId);
				}
            } catch (error) {}
        }
        return req.continue();
    });
    console.log("Go to", "extension page");
    await page2.goto(GRADIENT_EXTENSION_URL, {
        timeout: 60000,
        waitUntil: "networkidle2",
    });
    await new Promise((_func) => setTimeout(_func, 5000));
    const button = await page2.$("button");
    if (button) {
        await button.click();
    }
    await new Promise((_func) => setTimeout(_func, 10000));
    await page2.reload();
    console.log("Extension is activated!");
    const page3 = await browser.newPage();
	//await page3.setUserAgent(userAgent);
    page2.close();
    return page3;
}

async function loginDawn({ user, pass }) {
    const { browser, page } = await loginAndOpenExtension(
        { user, pass },
        pathToDawn,
    );
    const page2 = await browser.newPage();
	await page2.setUserAgent(userAgent);
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
    console.log(`Start Gradient extension success for user`, user);
    return { browser, page };
}

async function loginAndOpenExtension(user, path) {
    // Destructure proxy details if available
    let proxyHost, proxyPort, proxyUser, proxyPass;
    if (user.proxy) {
        [proxyHost, proxyPort, proxyUser, proxyPass] = user.proxy.split(":");
    }

    const args = [
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
        "--window-size=360,600",
        `--disable-extensions-except=${path}`,
        `--load-extension=${path}`,
    ];

    if (proxyHost) {
        args.push(`--proxy-server=http://${proxyHost}:${proxyPort}`);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args,
    });

    const page = (await browser.pages())[0];
	//userAgent = _.sample(userA).userAgent;
	//console.log('Set User Agent:', userAgent);
	await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36');

    if (proxyUser) {
        await page.authenticate({
            username: proxyUser,
            password: proxyPass,
        });
    }

    return { browser, page };
}

const getBlockmeshStatus = async (page, user) => {
    try {
        let frame = await getFrame(page);
        await frame.waitForSelector(".pulse", { timeout: 5000 });
        return true;
    } catch (error) {
        console.log("🚀 ~ getBlockmeshStatus ~ error:", error);
        return false;
    }
};

const printStats = async (page) => {
    let element3 = await page.$(
        '::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div)',
    );
    let value3 =
        (await page.evaluate((el) => el.textContent, element3)) || "N/A".trim();
    let element = await page.$(
        '::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1])',
    );
    let element2 = await page.$(
        '::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1])',
    );
    let value = await page.evaluate((el) => el.textContent, element);
    let value2 = await page.evaluate((el) => el.textContent, element2);
    console.log(new Date(), "Status:", value3);
    console.log(
        `Today's Taps: ${value2} ; Today's Uptime: ${value} ; Node ID: ${nodeId}`,
    );
    return value3;
};

function getRandomHeaderValue(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMilliseconds(fromMs, toMs) {
    return Math.floor(Math.random() * (toMs - fromMs + 1)) + fromMs;
}


const signInWithPassword = async (user, pass, key) => {
    console.log("Get new token");
    const url =
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
        key;

    const headers = {
        scheme: "https",
        accept: "*/*",
        priority: "u=1, i",
        "accept-encoding": getRandomHeaderValue([
            "gzip, deflate, br",
            "gzip, deflate, br, zstd",
        ]),
        "accept-language": getRandomHeaderValue([
            "en-US,en;q=0.9,vi;q=0.8",
            "en-GB,en;q=0.9",
            "en;q=0.8",
        ]),
        origin: "https://app.gradient.network",
        "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36",
        "Content-Type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-client-data":
            "CIy2yQEIo7bJAQipncoBCNCgygEI/9/KAQiUocsBCIWgzQEIjafNAQjTx84BCIjMzgEI9c/OAQ==",
        "x-client-version": "Chrome/JsCore/10.13.0/FirebaseCore-web",
        "x-firebase-gmpid": "1:236765003043:web:4300552603f2d14908a096",
    };

    const data = {
        returnSecureToken: true,
        email: user,
        password: pass,
        clientType: "CLIENT_TYPE_WEB",
    };

    try {
        const response = await axios.post(url, data, {
            ...headers,
            authority: "identitytoolkit.googleapis.com",
            path: "/v1/accounts:signInWithPassword?key=" + key,
        });
        tokenData = {
            accessToken: response.data.idToken,
            uid: response.data.localId,
            refreshToken: response.data.refreshToken,
        };

        try {
            await new Promise((_func) =>
                setTimeout(_func, getRandomMilliseconds(500, 2000)),
            );
            await axios.post(
                "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" +
                    key,
                {
                    idToken: response.data.idToken,
                },
                { headers },
            );

            await new Promise((_func) =>
                setTimeout(_func, getRandomMilliseconds(500, 2000)),
            );
            await axios.post(
                "https://api.gradient.network/api/user/profile",
                {},
                {
                    headers: {
                        ...headers,
                        authorization: "Bearer " + response.data.idToken,
                    },
                    referrer: "https://app.gradient.network/",
                    referrerPolicy: "strict-origin-when-cross-origin",
                },
            );

            const end = new Date().getTime();

            await new Promise((_func) =>
                setTimeout(_func, getRandomMilliseconds(500, 2000)),
            );

            await axios.post(
                "https://api.gradient.network/api/point/stats",
                {
                    start: end - 2592000000,
                    end: end,
                    type: "DAY",
                },
                {
                    headers: {
                        ...headers,
                        authorization: "Bearer " + response.data.idToken,
                    },
                    referrer: "https://app.gradient.network/",
                    referrerPolicy: "strict-origin-when-cross-origin",
                },
            );
        } catch (error) {
            console.log("Ignore error when emulator calls");
        }

        console.log("Sync new token:", tokenData.accessToken.slice(-4));
        return tokenData;
    } catch (error) {
        console.error(
            "Error:",
            error.response ? error.response.data : error.message,
        );
        throw error;
    }
};

async function gradientWithoutLogin({ user, pass, key }) {
    const { browser, page } = await loginAndOpenExtension(
        {
            user,
            pass,
        },
        pathToGradient,
    );
    await signInWithPassword(user, pass, key);
    await sendExtension(
        {
            user,
            pass,
            key,
        },
        page,
    );
    page.close();
    await new Promise((_func) => setTimeout(_func, 5000));
    (await browser.pages())[0].close();
    const page3 = await browser.newPage();
	//await page3.setUserAgent(userAgent);
    console.log("Extension is activated!");
    return {
        browser,
        page: page3,
    };
}

const sendExtension = async ({ user, pass }, page) => {
    if (!tokenData) {
        throw "Token Data is empty";
    }
    let err;
    await page.evaluate((data) => {
        try {
            const extensionId = "caacbgbklghmpodbdafajbgdnegacfmo";
            if (typeof chrome !== "undefined" && chrome.runtime) {
                if (data && data.accessToken) {
                    console.log(
                        "sending ChromeEx...",
                        data.accessToken.slice(-4),
                    );

                    // Simulate sending a login message to the extension
                    chrome.runtime.sendMessage(
                        extensionId,
                        {
                            action: "login",
                            data: {
                                token: data.accessToken,
                                uid: data.uid,
                                refresh: data.refreshToken,
                            },
                        },
                        (response) => {
                            console.log(response);
                        },
                    );
                } else {
                    // Simulate sending a logout message to the extension
                    chrome.runtime.sendMessage(
                        extensionId,
                        {
                            action: "logout",
                        },
                        (response) => {
                            console.log(response);
                        },
                    );
                }
            } else {
                console.log("non-chrome env");
            }
        } catch (error) {
            err = error;
            console.log("send ChromeEx Token Message error", error);
        }
    }, tokenData);
    console.log("Sending ChromeEx...", tokenData.accessToken.slice(-4));
    await new Promise((_func) => setTimeout(_func, 2000));
    if (err) {
        throw err;
    }
};

const getGraStatus = async (browser, page, user) => {
    try {
        let value3 = "N/A";
		let status = true;
		await page.setRequestInterception(true);
		page.on("request", (req) => {
			if (
				!!rejectRequestPattern.find((pattern) =>
					req.url().match(pattern),
				) ||
				rejectResourceTypes.includes(req.resourceType())
			) {
				return req.abort();
			}
			if (
				req
					.url()
					.includes("https://api.gradient.network/api/sentrynode/get") &&
				req.method() === "GET"
			) {
				try {
					const match = req.url().match(/\/([^\/]+)$/);
					const newNodeId = match ? match[1] : "N/A";
					if (newNodeId != nodeId) {
						nodeId = newNodeId;
						console.log("Get Node ID:", nodeId);
					}
				} catch (error) {}
			}
			return req.continue();
		});
        await page.goto(GRADIENT_EXTENSION_URL);
        console.log("Go to extension page");
        await page.waitForSelector(".avatar-container", { timeout: 10000 });

        try {
            value3 = await printStats(page);
            if (
                value3 &&
                (value3.toLowerCase() == "disconnected" ||
                    value3.toLowerCase() == "unsupported")
            ) {
                if (value3.toLowerCase() == "disconnected") {
                    /*console.log("Trying send token...");
                    const page2 = await browser.newPage();
                    await sendExtension(user, page2);
                    await new Promise((_func) => setTimeout(_func, 5000));
					page2.close();
                    await page.reload();
                    await new Promise((_func) => setTimeout(_func, 5000));
                    value3 = await printStats(page);*/
					let page2 = await browser.newPage();
					await page2.setUserAgent(userAgent);
					console.log("Reloading gradient dashboard...")
					await page2.goto("https://app.gradient.network", {
						timeout: 60000,
						waitUntil: "networkidle2",
					});
					await new Promise((_func) => setTimeout(_func, 10000));
					console.log("Reload dashboard done!")
					if (await waitForElementExists(page2, GRA_USER_INPUT)) {
						console.log("Account logout!");
						page2.close();
						status = false;
					} else {
						console.log("Reloading extension...");
						page2.close();
						await page.reload();
						await new Promise((_func) => setTimeout(_func, 10000));
						console.log("Reload extension done!");
						value3 = await printStats(page);
						/*if (value3.toLowerCase() == "disconnected" || value3.toLowerCase() == "unsupported") {
							status = false;
						}*/
					}
                } else {
					status = false;
				}
            }
        } catch (error) {
            console.log("🚀 ~ getGraStatus ~ error:", error);
        }
		
        const page2 = await browser.newPage();
		await page2.setUserAgent(userAgent);
        page.close();
        return {
            status: status,
            text: value3,
            page: page2,
        };
    } catch (error) {
        console.log("Error:", error);
        const page2 = await browser.newPage();
		await page2.setUserAgent(userAgent);
        page.close();
        return {
            status: false,
            text: "Disconnected",
            page: page2,
        };
    }
};

const saveScreenshot = async (page, user) => {
    try {
        await page.screenshot({ path: `./images/${user?.id}.png` });
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
	sendExtension,
	gradientWithoutLogin,
	signInWithPassword
};
