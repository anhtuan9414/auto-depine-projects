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
			console.log('Waiting for 5 minutes to restart...');
			await new Promise(_func=> setTimeout(_func, 300000));
			throw 'Device Unsupported';
		} else {
			if (!status) {
			  clearInterval(interval);
			  if ((await restartExtension(user)).toLowerCase() == 'unsupported') {
				  console.log('Waiting for 5 minutes to restart...');
				  await new Promise(_func=> setTimeout(_func, 300000));
				  throw 'Device Unsupported';
			  }
			  checkStatus();
			}
		}
      } catch (error) {
		clearInterval(interval);
		localPage.close();
		localBrowser.close();
        console.log("🚀 ~ checkStatus ~ error:", error);
		throw error;
     }
	},600000);
  }
  
  if ((await startExtension(user)).toLowerCase() == 'unsupported') {
	  console.log('Waiting for 5 minutes to restart...');
	  await new Promise(_func=> setTimeout(_func, 300000));
	  localPage.close();
	  localBrowser.close();
	  throw 'Device Unsupported';
  }
  
  checkStatus();
}

main();
