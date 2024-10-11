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
  let users = [{id: 'Depin', user: process.env.USER, pass: process.env.PASS}];
  console.log("🚀 ~ Start Script ~");
  if (!users) {
    await timers.setTimeout(300000);
  }
  
  let browsers = {};
  let pages = {};
  let diconnect = {};
  
  const startExtension = async function (user) {
    let { browser, page: localPage } = await loginGradient(user);
    pages[user.id] = localPage;
    browsers[user.id] = browser;
  };
  
  const restartExtension = async function (user) {
    try {
		if (browsers[user.id]) {
		  pages[user.id] = undefined;
		  await browsers[user.id].close();
		}
	} catch (error) {
	   console.log("🚀 ~ Close browser ~ error:", error);
	}
    await startExtension(user);
  };

  // Update status
  setInterval(async () => {
    for (const user of users) {
      if (!pages[user.id]) continue;
      try {
        diconnect[user.id] = 0;
        let status = await getGraStatus(pages[user.id], user);
        // await updateConnectionStatus(user.id, status);
        if (!status) {
		  console.log("Status: Diconnected!");
          if (diconnect[user.id] === undefined) diconnect[user.id] = 0;
          diconnect[user.id]++;
		  if (diconnect[user.id] % 5 === 0) {
            restartExtension(user);
          }
        } else {
		  console.log("Status: Connected!");
		}
      } catch (error) {
        console.log("🚀 ~ setInterval ~ error:", error);
      }
    }
  }, 60000);
  let chunkUSers = lodash.chunk(users, 5);
  for (const chunk of chunkUSers) {
    await Promise.all(chunk.map(startExtension));
  }
}

main();
