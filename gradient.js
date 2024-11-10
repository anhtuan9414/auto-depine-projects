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
	let {status, text, page} = await getGraStatus(localBrowser, localPage, user);
	localPage = page;
	return text;
  };
  
  const restartExtension = async function (user) {
	console.log("Relogin extension...");
    localPage = await reloginGradient(user, localPage, localBrowser);
	let {status, text, page} = await getGraStatus(localBrowser, localPage, user);
	localPage = page;
	return text;
  };
  
  let interval
  const checkStatus = () => {
	interval = setInterval(async () => {
	try {
        let {status, text, page} = await getGraStatus(localBrowser, localPage, user);
		localPage = page;
		if (text.toLowerCase() == 'unsupported') {
			clearInterval(interval);
			localPage.close();
		} else {
			if (!status) {
			  clearInterval(interval);
			  if ((await restartExtension(user)).toLowerCase() == 'unsupported') {
				  localPage.close();
				  return;
			  }
			  checkStatus();
			}
		}
      } catch (error) {
		clearInterval(interval);
        console.log("🚀 ~ setInterval ~ error:", error);
		throw error;
     }
	},600000);
  }
  
  if ((await startExtension(user)).toLowerCase() == 'unsupported') {
	  localPage.close();
	  return;
  }
  
  checkStatus();
}

main();
