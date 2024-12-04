var puzzle_id_g = "";
var puzzle_id_popup_g = "";
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
  const signinForm = document.getElementById("signinForm");
  const errorDiv = document.getElementById("error");
  const loginButton = document.getElementById("loginButton");

  chrome.storage.local.set({ token: "" }, () => {});
  chrome.storage.local.set({ username: "" }, () => {});

  chrome.storage.local.set({ referralCode: "" }, () => {});
  chrome.storage.local.set({ twitter_x_id_points: "" }, () => {});
  chrome.storage.local.set({ discordid_points: "" }, () => {});
  chrome.storage.local.set({ telegramid_points: "" }, () => {});
  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const puzzelAns = document.getElementById("puzzelAns").value;
    loginButton.disabled = true;
    loginButton.style.cursor = "not-allowed";
    const version = chrome.runtime.getManifest().version;

    try {
      const response = await fetchWithRetry(
        `https://www.aeropres.in/chromeapi/dawn/v1/user/login/v2?appid=${appid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email.replace(/\s+/g, ""),
            password: password.replace(/\s+/g, ""),
            logindata: { _v: { version }, datetime: new Date() },
            puzzle_id: puzzle_id_g,
            ans: puzzelAns.replace(/\s+/g, ""),
          }),
        }
      );

      const data = await response.json();
      //alert(JSON.stringify(data));

      if (response.ok) {
        chrome.storage.local.set(
          { username: btoa(email.replace(/\s+/g, "")) },
          () => {}
        );

        chrome.storage.local.set(
          { referralCode: data.data.referralCode },
          () => {}
        );

        chrome.storage.local.set(
          { firstname: btoa(data.data.firstname) },
          () => {}
        );

        chrome.storage.local.set(
          {
            twitter_x_id:
              data.data.twitter_x_id == undefined ? "" : data.data.twitter_x_id,
          },
          () => {}
        );

        chrome.storage.local.set(
          {
            discordid:
              data.data.discordid == undefined ? "" : data.data.discordid,
          },
          () => {}
        );

        chrome.storage.local.set(
          {
            telegramid:
              data.data.telegramid == undefined ? "" : data.data.telegramid,
          },
          () => {}
        );

        chrome.storage.local.set({ token: btoa(data.data.token) }, () => {
          window.location.href = "dashboard.html";
        });
      } else {
        throw new Error(data.message || "An error occurred");
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      getPuzzel();
      loginButton.disabled = false;
      loginButton.style.cursor = "pointer";

      if (
        error.message ==
        "Email not verified , Please check spam folder incase you did not get email"
      ) {
        document.getElementById("clickToOpenPuzzelPopup").style.display =
          "inline";
      } else {
        document.getElementById("clickToOpenPuzzelPopup").style.display =
          "none";
      }
      if (error.message == "refresh your captcha!!") {
        errorDiv.textContent = "Please Enter Your Captcha Again!";
      }
      if (error.message == "Incorrect answer. Try again!") {
        errorDiv.textContent = "Incorrect answer. Try again!";
      }
      if (error.message.includes("#11")) {
        alert(error.message);
      }
    }
  });

  document
    .getElementById("captcha-Refresh")
    .addEventListener("click", async () => {
      getPuzzel();
    });
  document
    .getElementById("captcha-Refresh-popup")
    .addEventListener("click", async () => {
      getPuzzelPopup();
    });
  document
    .getElementById("clickToOpenPuzzelPopup")
    .addEventListener("click", async () => {
      // const email = document.getElementById("email").value;
      // const data = {
      //   username: email,
      // };
      getPuzzelPopup();
    });

  document
    .getElementById("clickToResendEmail")
    .addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const puzzelAnsPopup = document.getElementById("puzzelAnsPopup").value;

      const data = {
        username: email.replace(/\s+/g, ""),
        puzzle_id: puzzle_id_popup_g,
        ans: puzzelAnsPopup.replace(/\s+/g, ""),
      };
      await resendVerifyLink(data);
    });
  getPuzzel();
});

async function getPuzzel() {
  try {
    const response = await fetch(
      `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle?appid=${appid}`
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    puzzle_id_g = data.puzzle_id;
    getPuzzelbase64(data.puzzle_id);
    return data;
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
  }
}
async function getPuzzelbase64(puzzelid) {
  try {
    const response = await fetch(
      `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle-image?puzzle_id=${puzzelid}&appid=${appid}`
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    const puzzleImage = document.getElementById("puzzleImage");
    const puzzle = document.getElementById("captcha");
    const loader = document.getElementById("loader");

    puzzleImage.src = "data:image/jpeg;base64," + data.imgBase64;
    puzzle.style.display = "inline";
    loader.style.display = "none";

    return data;
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
  }
}
async function getPuzzelPopup() {
  try {
    const response = await fetch(
      `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle?appid=${appid}`
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    puzzle_id_popup_g = data.puzzle_id;
    getPuzzelbase64Popup(data.puzzle_id);
    return data;
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
  }
}
async function getPuzzelbase64Popup(puzzelid) {
  try {
    const response = await fetch(
      `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/get-puzzle-image?puzzle_id=${puzzelid}&appid=${appid}`
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();
    const puzzleImage = document.getElementById("puzzleImagePopup");
    const puzzle = document.getElementById("captchapopup");
    const loader = document.getElementById("loaderpopup");
    puzzle.style.display = "inline";
    loader.style.display = "none";
    puzzleImage.src = "data:image/jpeg;base64," + data.imgBase64;

    return data;
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
  }
}
async function resendVerifyLink(data) {
  const verifyerror = document.getElementById("verifyerror");

  const url = `https://www.aeropres.in/chromeapi/dawn/v1/user/resendverifylink/v2?appid=${appid}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const _data = await response.json();

    if (!response.ok) {
      throw new Error(_data.message || "An error occurred");
    }

    // const result = await response.json();
    // console.log("Verification link resent successfully:", result);
    alert("Verification link resent successfully");
    window.location.href = "signin.html";
  } catch (error) {
    // console.error("Error resending verification link:", error);
    // alert("Error resending verification link:" + error);

    if (error.message == "refresh your captcha!!") {
      verifyerror.textContent = "Please Enter Your Captcha Again!";
      getPuzzelPopup();
    }
    if (error.message == "Incorrect answer. Try again!") {
      verifyerror.textContent = "Incorrect answer. Try again!";
    }
    if (error.message.includes("#11")) {
      alert(error.message);
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
