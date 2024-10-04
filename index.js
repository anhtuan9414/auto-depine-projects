const timers = require("node:timers/promises");
const { loginAndOpenExtension, getBlockmeshStatus } = require("./lib");
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
  let users = [{id: 'fuck', user: process.env.USER, pass: process.env.PASS}];
  console.log("🚀 ~ main ~ user:", users.length);
  if (!users) {
    await timers.setTimeout(300000);
  }
  
  // let browsers = {};
  let pages = {};
  let diconnect = {};
  const startExtension = async function (user) {
    let { browser, page: localPage } = await loginAndOpenExtension(user);
    pages[user.id] = localPage;
    // browsers[user.id] = browser;
  };
  const refreshExtension = async function (user) {
    if (pages[user.id]) await pages[user.id].reload();
  };
  const restartExtension = async function (user) {
    if (browser[user.id]) {
      pages[user.id] = undefined;
      await browser[user.id].close();
    }
    await startExtension();
  };
  setInterval(async () => {
    for (const user of users) {
      refreshExtension(user);
    }
  }, 60 * 60 * 1000);

  // Update status
  setInterval(async () => {
    for (const user of users) {
      if (!pages[user.id]) continue;
      try {
        diconnect[user.id] = 0;
        let status = await getBlockmeshStatus(pages[user.id], user);
        console.log("🚀 ~ getBlockmeshStatus ~ status:", user.id, status);
        // await updateConnectionStatus(user.id, status);
        if (!status) {
          if (diconnect[user.id] === undefined) diconnect[user.id] = 0;
          diconnect[user.id]++;
          if (diconnect[user.id] % 5 === 0) {
            restartExtension(user);
          }
        }
      } catch (error) {
        console.log("🚀 ~ setInterval ~ error:", error);
      }
    }
  }, 120000);
  let chunkUSers = lodash.chunk(users, 5);
  for (const chunk of chunkUSers) {
    await Promise.all(chunk.map(startExtension));
  }
}

main();
