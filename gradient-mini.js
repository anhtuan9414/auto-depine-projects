const timers = require("node:timers/promises");
const { getGraStatus, loginGradient, reloginGradient, gradientWithoutLogin, printStats, sendExtension } = require("./lib-mini");
const axios = require("axios").default;
const { HttpsProxyAgent } = require("https-proxy-agent");
const {
  getUsers,
  updateConnectionStatus,
  saveScreenshot,
} = require("./connection/pgConnection");
const lodash = require("lodash");
async function main() {
  // extract user
  // let [user, offset] = process.env.GRASS_USER.split("-");
  // let users = await getUsers(user + "@gmail.com", offset);
  let user = {id: 'Depin', user: process.env.USER, pass: process.env.PASS, key: process.env.KEY};
  console.log("🚀 ~ Start Script ~");
  
  let localBrowser;
  let localPage;
  
  const startExtension = async function (user) {
    let { browser, page: localPage1 } = await gradientWithoutLogin(user);
    localPage = localPage1;
    localBrowser = browser;
	return true;
  };
  
  let interval
  const checkStatus = () => {
	interval = setInterval(async () => {
	try {
		await sendExtension(user, localPage);
      } catch (error) {
		localPage.close();
		localBrowser.close();
		clearInterval(interval);
        console.log("🚀 ~ setInterval ~ error:", error);
		throw error;
     }
	},1800000);
  }
  
  await startExtension(user);
  
  checkStatus();
}

main();
