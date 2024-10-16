const puppeteer = require("puppeteer-extra");
const timers = require("node:timers/promises");
const path = require("path");
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

async function loginBlockmesh({user, pass}) {
  const {browser, page} = await loginAndOpenExtension({user, pass}, pathToBlockmesh);
  await page.goto(BLOCKMESH_EXTENSION_URL, {
    timeout: 60000,
    waitUntil: "networkidle2",
  });
  const iframeHandle = await page.waitForSelector("iframe", {visible: true});
  let frame = await iframeHandle.contentFrame();
  await frame.waitForSelector(BLOCKMESH_USER_INPUT);
  await frame.type(BLOCKMESH_USER_INPUT, user);
  await frame.type(BLOCKMESH_PASS_INPUT, pass);
  await frame.waitForSelector(BLOCKMESH_PASS_INPUT);
  // press enter
  await page.keyboard.press("Enter");
  await blockMeshFrame.waitForSelector(".pulse", {timeout: 30000});
  console.log(
      `Start Blockmesh extension success for user`,
      user
   );
  return {browser, page};
}

async function loginGradient({user, pass}) {
  const {browser, page} = await loginAndOpenExtension({user, pass}, pathToGradient);
  await page.goto(GRADIENT_EXTENSION_URL, {
    timeout: 60000,
    waitUntil: "networkidle2",
  });
  const page2 = (await browser.pages())[1];
  await page2.waitForSelector(GRA_USER_INPUT);
  await page2.type(GRA_USER_INPUT, user);
  await page2.type(GRA_PASS_INPUT, pass);
  await page2.waitForSelector(GRA_PASS_INPUT);
  // press enter
  await page2.keyboard.press("Enter");
  await new Promise(_func=> setTimeout(_func, 10000));
  await page2.waitForSelector('::-p-xpath(//a[@href="/dashboard/setting"])');
  console.log('Logged in successfully!')
  await page2.close();
  await page.reload();
  await new Promise(_func=> setTimeout(_func, 5000));
  await page.click('button');
  await new Promise(_func=> setTimeout(_func, 20000));
  await page.reload();
  console.log('Extension is activated!');
  return {browser, page};
}


async function loginDawn({user, pass}) {
  const {browser, page} = await loginAndOpenExtension({user, pass}, pathToDawn);
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
  return {browser, page};
}

async function loginAndOpenExtension(user, path) {
  let proxyHost, proxyPort, proxyUser, proxyPass;
  
  if (user.proxy) {
    [proxyHost, proxyPort, proxyUser, proxyPass] = user.proxy.split(":");
  }
  
  args = [
    "--no-sandbox",
    "--no-zygote",
	'--disable-dev-shm-usage',
    `--disable-extensions-except=${path}`,
    `--load-extension=${path}`,
    "--window-size=360,600",
    // '--disable-features=site-per-process',
    // '--site-per-process'
  ];
  
  if (proxyHost) {
    args.push(`--proxy-server=http://${proxyHost}:${proxyPort}`);
  }
  
  let browser = await puppeteer.launch({
    headless: 'new',
    args,
    // defaultViewport: {width: 800, height: 600, deviceScaleFactor: 2},
    // targetFilter: (target) => target.type() !== "other", // Anh huong den iframe
  });
  
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
  return {browser, page};
}

const getBlockmeshStatus = async (page, user) => {
  try {
    let frame = await getFrame(page);
    await frame.waitForSelector(".pulse", {timeout: 5000});
    return true;
  } catch (error) {
    console.log("🚀 ~ getBlockmeshStatus ~ error:", error);
    return false;
  }
};


const getGraStatus = async (page, user) => {
  try {
	await page.reload();
    await page.waitForSelector(".avatar-container", {timeout: 5000});
	try {
		let element = await page.$('::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1])');
		let element2 = await page.$('::-p-xpath(//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1])');
		let value = await page.evaluate(el => el.textContent, element);
		let value2 = await page.evaluate(el => el.textContent, element2);
		console.log(`Today's Taps: ${value2} ; Today's Uptime: ${value}`);
	} catch (error) {
		console.log("🚀 ~ getBlockmeshStatus ~ error:", error);
	}
    return true;
  } catch (error) {
    console.log("🚀 ~ getBlockmeshStatus ~ error:", error);
    return false;
  }
};

const saveScreenshot = async (page, user) => {
  try {
    await page.screenshot({path: `./images/${user?.id}.png`});
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
  getGraStatus
};
