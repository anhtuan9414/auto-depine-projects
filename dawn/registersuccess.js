let tempusername;
var puzzle_id_g = "";
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
  chrome.storage.local.get("tempusername", (result) => {
    tempusername = result.tempusername;
    document.getElementById("tempusername").textContent = tempusername;
  });
  document
    .getElementById("clickToResendEmailRegister")
    .addEventListener("click", async () => {
      const email = tempusername;
      const puzzelAnsPopup = document.getElementById("puzzelAnsPopup").value;

      const data = {
        username: email.replace(/\s+/g, ""),
        puzzle_id: puzzle_id_g,
        ans: puzzelAnsPopup,
      };
      await resendVerifyLink(data);
    });
  document
    .getElementById("clickToGetCaptcha")
    .addEventListener("click", async () => {
      getPuzzelPopup();
    });

  document
    .getElementById("captcha-Refresh-popup")
    .addEventListener("click", async () => {
      getPuzzelPopup();
    });
});
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
    puzzle_id_g = data.puzzle_id;
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
