let token;
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
document.addEventListener("DOMContentLoaded", () => {
  const myReferralCode = document.getElementById("myReferralCode");
  // const myReferralCodeLink = document.getElementById("myReferralCodeLink");

  const twitterShareBtn = document.getElementById("twitterShareBtn");
  const discordShareBtn = document.getElementById("discordShareBtn");
  const telegramShareBtn = document.getElementById("telegramShareBtn");

  chrome.storage.local.get("referralCode", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.referralCode == undefined ||
      result.referralCode == ""
    ) {
      alert("Login first!! referralCode not found");
    } else {
      console.log(result.referralCode);
      myReferralCode.value = result.referralCode;
      // myReferralCodeLink.value = "https://www.dawninternet.com/register/?referralCode="+result.referralCode;
    }
  });

  chrome.storage.local.get("token", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.token == undefined ||
      result.token == ""
    ) {
      alert("Login first!! token not found");
    } else {
      token = atob(result.token);
    }
  });
  chrome.storage.local.get("twitter_x_id_points", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.twitter_x_id_points == undefined ||
      result.twitter_x_id_points == "" ||
      result.twitter_x_id_points == 0
    ) {
      const icon = document.getElementById("twitter_x_id_points");
      icon.style.color = "black";
      icon.style.fontSize = "small";
      const claimed = document.getElementById("twitter_x_id_tick");
      claimed.style.display = "none";
    } else {
      const icon = document.getElementById("twitter_x_id_points");
      icon.style.display = "none";
      const claimed = document.getElementById("twitter_x_id_tick");
      claimed.style.display = "block";
      claimed.style.color = "#EA651E";
      claimed.style.fontSize = "small";
      claimed.style.fontWeight = "600";
      claimed.style.marginInlineStart = "10px";
    }
  });
  chrome.storage.local.get("discordid_points", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.discordid_points == undefined ||
      result.discordid_points == "" ||
      result.discordid_points == 0
    ) {
      const icon = document.getElementById("discordid_points");
      icon.style.color = "black";
      icon.style.fontSize = "small";
      const claimed = document.getElementById("discordid_tick");
      claimed.style.display = "none";
    } else {
      const icon = document.getElementById("discordid_points");
      icon.style.display = "none";
      const claimed = document.getElementById("discordid_tick");
      claimed.style.display = "block";
      claimed.style.color = "#EA651E";
      claimed.style.fontSize = "small";
      claimed.style.fontWeight = "600";
      claimed.style.marginInlineStart = "13px";
    }
  });

  chrome.storage.local.get("telegramid_points", async (result) => {
    if (
      result == undefined ||
      result == null ||
      result.telegramid_points == undefined ||
      result.telegramid_points == "" ||
      result.telegramid_points == 0
    ) {
      const icon = document.getElementById("telegramid_points");
      icon.style.color = "black";
      icon.style.fontSize = "small";
      const claimed = document.getElementById("telegramid_tick");
      claimed.style.display = "none";
    } else {
      const icon = document.getElementById("telegramid_points");
      icon.style.display = "none";
      const claimed = document.getElementById("telegramid_tick");
      claimed.style.display = "block";
      claimed.style.color = "#EA651E";
      claimed.style.fontSize = "small";
      claimed.style.fontWeight = "600";
      claimed.style.marginInlineStart = "20px";
    }
  });

  twitterShareBtn.addEventListener("click", async () => {
    //alert("twitter");
    let twitter_x_id = document.getElementById("twitter_x_id").value;
    let data = { twitter_x_id: "twitter_x_id" };
    await updateProfile(token, data);
    const url = "https://twitter.com/dawninternet";
    window.open(url, "_blank");
    return true;
  });

  discordShareBtn.addEventListener("click", async () => {
    //alert("discordShareBtn");
    let discordid = document.getElementById("discordid").value;
    let data = { discordid: "discordid" };
    await updateProfile(token, data);
    const url = "https://discord.gg/pb9ktNCKvr";
    window.open(url, "_blank");
    return true;
  });
  telegramShareBtn.addEventListener("click", async () => {
    //alert("telegramShareBtn");
    let telegramid = document.getElementById("telegramid").value;
    let data = { telegramid: "telegramid" };
    await updateProfile(token, data);
    const url = "https://t.me/+KbNPWHXb2n5iNTIx";
    window.open(url, "_blank");
    return true;
  });
});

async function updateProfile(_token, data) {
  const url = `https://www.aeropres.in/chromeapi/dawn/v1/profile/update?appid=${appid}`;
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    //alert("success")
  } catch (error) {
    console.error("Error updating profile:", error);
    //alert("Error!! "+error);
    alert(error.message);

    let m = error.message;
    let word = "TokenExpiredError";
    let word2 = "session";
    if (m.includes(word) || m.includes(word2)) {
      window.location.href = "signin.html";
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
