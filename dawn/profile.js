let token;
let lastUpdatedTime;
let isInternet = false;
let appid;
chrome.storage.local.get(["appid"], function (result) {
  if (
    result.appid !== undefined &&
    result.appid !== null &&
    result.appid !== ""
  ) {
    appid = result.appid;
  }
});
//let expiredToken = "2056b72d0eb33beb2a6d2d39c67296afa677fc1f271efaf0d84b5d50cd08aee410c07f2f8a6510b58ab067551517964a9b712a207a15ea4f311b2b0364b0fd4be4b73a16b0be5708eaea1eeecc896238091f290f0f7a173e8a665a8cda3fe8625e6669adee14f08415335e123bac05218478fd5bfaf8810145bd97daf7c53b5039db2dd60cfd0de17ab9bd349623887c02a7789691d1c1fd02de15b2d9061b55c82233432f43b08ee746286fcc9515a18adfc9193e433d8c56c867a3e8a54ade18f11660f597e5fa46099ca5f2cc5f59356039379db30f6dc8af5c355ab82406c41fba212b6b3cc3eb36759c84491347";

document.addEventListener("DOMContentLoaded", () => {
  const networkquality = document.getElementById("netwokquality_");
  const lastupdatedatetime = document.getElementById("lastupdatedatetime");
  const appversion = document.getElementById("appversion");

  const version = chrome.runtime.getManifest().version;
  console.log(version);
  appversion.textContent = "v" + " " + version;
  chrome.storage.local.get("token", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.token == undefined ||
      result.token == ""
    ) {
      alert("Login first!!");
    } else {
      console.log("storage");
      token = atob(result.token);
    }
  });

  chrome.storage.local.get("firstname", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.firstname == undefined ||
      result.firstname == ""
    ) {
      alert("Login first!!");
    } else {
      document.getElementById("fullname").value = atob(result.firstname);
    }
  });

  chrome.storage.local.get("username", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.username == undefined ||
      result.username == ""
    ) {
      alert("Login first!!");
    } else {
      document.getElementById("username").value = atob(result.username);
    }
  });
  chrome.storage.local.get("twitter_x_id", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.twitter_x_id == undefined ||
      result.twitter_x_id == ""
    ) {
      // alert("Login first!!");
    } else {
      document.getElementById("twitter_x_id").value = result.twitter_x_id;
    }
  });

  chrome.storage.local.get("discordid", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.discordid == undefined ||
      result.discordid == ""
    ) {
      //alert("Login first!!");
    } else {
      document.getElementById("discordid").value = result.discordid;
    }
  });

  chrome.storage.local.get("telegramid", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.telegramid == undefined ||
      result.telegramid == ""
    ) {
      // alert("Login first!!");
    } else {
      document.getElementById("telegramid").value = result.telegramid;
    }
  });

  const btnProfileUpdate = document.getElementById("btnProfileUpdate");

  btnProfileUpdate.addEventListener("click", async () => {
    const fullname = document.getElementById("fullname").value;
    const password = document.getElementById("password").value;
    const twitter_x_id = document.getElementById("twitter_x_id").value;
    const discordid = document.getElementById("discordid").value;
    const telegramid = document.getElementById("telegramid").value;

    let data = { fullname, password, twitter_x_id, discordid, telegramid };
    //let data ={};
    await updateProfile(token, data);
  });
});

async function updateProfile(_token, data) {
  const btnProfileUpdate = document.getElementById("btnProfileUpdate");

  btnProfileUpdate.disabled = true;
  btnProfileUpdate.style.cursor = "not-allowed";
  const url = `https://www.aeropres.in/chromeapi/dawn/v1/profile/updatename?appid=${appid}`;
  const token = "Brearer " + _token; // Replace with your actual authorization token

  // const data = {
  //     twitter_x_id: 't',
  //     discordid: 'd',
  //     telegramid: 't'
  // };

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "An error occurred");
    }

    if (data.fullname != "") {
      chrome.storage.local.set({ firstname: data.fullname }, () => {});
    }

    chrome.storage.local.set(
      { twitter_x_id: data.twitter_x_id == undefined ? "" : data.twitter_x_id },
      () => {}
    );

    chrome.storage.local.set(
      { discordid: data.discordid == undefined ? "" : data.discordid },
      () => {}
    );

    chrome.storage.local.set(
      { telegramid: data.telegramid == undefined ? "" : data.telegramid },
      () => {}
    );

    btnProfileUpdate.disabled = false;
    btnProfileUpdate.style.cursor = "pointer";
    alert("success");
  } catch (error) {
    console.error("Error updating profile:", error);
    btnProfileUpdate.disabled = false;
    btnProfileUpdate.style.cursor = "pointer";
    if (error.message != undefined && error.message != "") {
      alert(error.message);

      let m = error.message;
      let word = "TokenExpiredError";
      let word2 = "session";
      if (m.includes(word) || m.includes(word2)) {
        window.location.href = "signin.html";
      }
    }
  }
}

async function fetchWithRetry(url, options = {}) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3 seconds

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);
      return response; // If successful, return the response
    } catch (error) {
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        // This error typically indicates a network error (server down)
        if (attempt === MAX_RETRIES) {
          throw error; // If all retries failed, throw the last error
        }
        console.log(
          `Server seems to be down. Attempt ${attempt} failed. Retrying in ${
            RETRY_DELAY / 1000
          } seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      } else {
        // For other types of errors, throw immediately without retrying
        throw error;
      }
    }
  }
}
