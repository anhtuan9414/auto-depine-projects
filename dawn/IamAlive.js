let username;
let appid;
chrome.storage.local.get(["username"], async function (result) {
  if (
    result.username !== undefined &&
    result.username !== null &&
    result.username !== ""
  ) {
    username = atob(result.username);
  } else {
    username = "NA";
  }
});
chrome.storage.local.get(["appid"], function (result) {
  if (
    result.appid !== undefined &&
    result.appid !== null &&
    result.appid !== ""
  ) {
    appid = result.appid;
  }
});
function reloadUserName() {
  chrome.storage.local.get(["username"], async function (result) {
    if (
      result.username !== undefined &&
      result.username !== null &&
      result.username !== ""
    ) {
      username = atob(result.username);
    } else {
      username = "NA";
    }
  });
}

function keepAlive() {
  try {
    reloadUserName();
    console.log("Background script is alive: " + new Date().toLocaleString());
  const version = chrome.runtime.getManifest().version;

    chrome.storage.local.get(["token"], async function (result) {
      if (
        result.token !== undefined &&
        result.token !== null &&
        result.token !== ""
      ) {
        let token = atob(result.token);
        //console.log(token);

        try {
          // if(tabs.length==0)
          //   {
          //     console.log("browser not open");
          //     //return;
          //   }
          const response = await fetch(
            `https://www.aeropres.in/chromeapi/dawn/v1/userreward/keepalive?appid=${appid}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Berear " + token,
              },
              body: JSON.stringify({
                username: username,
                extensionid: chrome.runtime.id,
                numberoftabs: 0,
                _v: version,
              }),
            }
          );
          const data = await response.json();
          if (response.ok) {
            console.log(data);
          } else {
            throw new Error(data.message || "An error occurred");
          }
        } catch (error) {
          if (error.message != undefined && !error.message.includes("fetch")) {
            //alert(error.message);
            let m = error.message;
            let word = "TokenExpiredError";
            let word2 = "session";
            if (m.includes(word) || m.includes(word2)) {
              sendResponse({ status: "SessionExpired" });
            }
          }
        }
      } else {
        console.log("token is not set");
      }
    });
  } catch (expKeepAlive) {
    console.log(expKeepAlive);
  }
}

chrome.alarms.create("keepAlive", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    keepAlive();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "keepAlive") {
    keepAlive();
    sendResponse({ status: "alive" });
  }
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");
  keepAlive();
});

// Listen for Chrome startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started");
  keepAlive();
});
// Initial call
keepAlive();
