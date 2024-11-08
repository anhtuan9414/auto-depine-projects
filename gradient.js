const timers = require("node:timers/promises");
const { getGraStatus, loginGradient } = require("./lib");
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
	await localPage1.goto('chrome://extensions/');
  };
  
  await startExtension(user);
  
  // Update status
  setInterval(async () => {
	try {
        let status = await getGraStatus(localPage, user);
        if (!status) {
		  console.log("Status: Diconnected!");
		  await localBrowser.close();
		  await startExtension(user);
        } else {
		  await localPage.goto('chrome://extensions/');
		  console.log("Status: Connected!");
		}
      } catch (error) {
        console.log("🚀 ~ setInterval ~ error:", error);
     }
  },120000);
}

main();
