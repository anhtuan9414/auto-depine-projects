const puppeteer = require("puppeteer-extra");
const timers = require("node:timers/promises");
const path = require("path");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const puppeteerStealth = StealthPlugin();
// puppeteerStealth.enabledEvasions.delete("user-agent-override");
puppeteer.use(puppeteerStealth);
// BLOCKMESH
const BLOCKMESH_EXTENSION_URL = `chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html`;
const DAWN_EXTENSION_URL = `chrome-extension://fpdkjdnhkakefebpekbdhillbhonfjjp/signin.html`;

const BLOCKMESH_USER_INPUT = `::-p-xpath(//input[@name="email"])`;
const BLOCKMESH_PASS_INPUT = '::-p-xpath(//input[@name="password"])';
const DAWN_USER_INPUT = `::-p-xpath(//input[@name="email"])`;
const DAWN_PASS_INPUT = '::-p-xpath(//input[@name="password"])';

async function loginBlockmesh(page, {user, pass}) {
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
  return frame;
}
async function loginDawn(page) {
  await page.goto(DAWN_EXTENSION_URL, {
    timeout: 60000,
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(DAWN_USER_INPUT);
  await page.type(DAWN_USER_INPUT, USER);
  await page.type(DAWN_PASS_INPUT, PASS);
  await page.waitForSelector(DAWN_PASS_INPUT);
  // press enter
  await page.keyboard.press("Enter");
}

async function loginAndOpenExtension(user) {
  const pathToBlockmesh = path.join(process.cwd(), "blockmesh");
  const pathToDawn = path.join(process.cwd(), "dawn");

  let proxyHost, proxyPort, proxyUser, proxyPass;
  if (user.proxy) {
    [proxyHost, proxyPort, proxyUser, proxyPass] = user.proxy.split(":");
  }
  args = [
    "--no-sandbox",
    "--no-zygote",
    `--disable-extensions-except=${pathToBlockmesh}`,
    `--load-extension=${pathToBlockmesh}`,
    "--window-size=360,600",
    // '--disable-features=site-per-process',
    // '--site-per-process'
  ];
  if (proxyHost) {
    args.push(`--proxy-server=http://${proxyHost}:${proxyPort}`);
  }
  let browser = await puppeteer.launch({
    // headless: false,
    args,
    // defaultViewport: {width: 800, height: 600, deviceScaleFactor: 2},
    // targetFilter: (target) => target.type() !== "other", // Anh huong den iframe
  });
  const page = (await browser.pages())[0]; // <-- bypasses Cloudflare
  await page.setUserAgent(
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0`
  );
  if (proxyUser) {
    await page.authenticate({
      username: proxyUser,
      password: proxyPass,
    });
  }
  try {
    let blockMeshFrame = await loginBlockmesh(page, user);
    await blockMeshFrame.waitForSelector(".pulse", {timeout: 30000});
    console.log(
      `Start Blockmesh extension success for user`,
      user.id,
      user.user
    );

    // const page2 = await browser.newPage();

    // if (proxyUser) {
    //   await page.authenticate({
    //     username: proxyUser,
    //     password: proxyPass,
    //   });
    // }
    // await loginDawn(page2);
    return {browser, page};
  } catch (error) {
    console.log("🚀 ~ loginAndOpenExtension ~ error:", error);
    await browser.close();
    // throw error;d
    return loginAndOpenExtension(user);
  }
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
  getBlockmeshStatus,
  saveScreenshot,
  getFrame,
};
