const timers = require("node:timers/promises");
const { getGraStatus, loginGradient, reloginGradient } = require("./lib");
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
  let user = {id: 'Depin', user: process.env.USER, pass: process.env.PASS};
  console.log("🚀 ~ Start Script ~");
  
  let localBrowser;
  let localPage;
  
  const startExtension = async function (user) {
    let { browser, page: localPage1 } = await loginGradient(user);
    localPage = localPage1;
    localBrowser = browser;
	await getGraStatus(localPage, user);
	await localPage1.goto('chrome://extensions/');
  };
  
  const restartExtension = async function (user) {
	console.log("Relogin extension...");
    await reloginGradient(user, localPage);
	await getGraStatus(localPage, user);
	await localPage.goto('chrome://extensions/');
  };
  
  let interval
  const checkStatus = () => {
	interval = setInterval(async () => {
	try {
        let {status, text} = await getGraStatus(localPage, user);
		if (text.toLowerCase() == 'unsupported') {
			clearInterval(interval);
		} else {
			if (!status) {
			  clearInterval(interval);
			  await restartExtension(user);
			  checkStatus();
			} else {
			  await localPage.goto('chrome://extensions/');
			}
		}
      } catch (error) {
        console.log("🚀 ~ setInterval ~ error:", error);
     }
	},3600000);
  }
  await startExtension(user);
  checkStatus();
}

main();
