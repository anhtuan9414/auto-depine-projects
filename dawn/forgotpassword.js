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
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const errorDiv = document.getElementById("error");
  const emailWarnForgotPass = document.getElementById("emailWarnForgotPass");
  emailWarnForgotPass.style.display = "none";

  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const puzzelAns = document.getElementById("puzzelAns").value;
    const recoveyLinkBtn = document.getElementById("recoveyLinkBtn");

    recoveyLinkBtn.disabled = true;
    recoveyLinkBtn.style.cursor = "not-allowed";
    if (!isValidEmail(email.replace(/\s+/g, ""))) {
      alert("Please Enter valid email!!");
      recoveyLinkBtn.disabled = false;
      recoveyLinkBtn.style.cursor = "pointer";
      return;
    }

    try {
      const response = await fetch(
        `https://www.aeropres.in/chromeapi/dawn/v1/user/sendforgotpasswordlink/v2?appid=${appid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email.replace(/\s+/g, ""),
            puzzle_id: puzzle_id_g,
            ans: puzzelAns,
          }),
        }
      );

      const data = await response.json();
      //alert(JSON.stringify(data));
      if (response.ok) {
        emailWarnForgotPass.style.display = "block";
        getPuzzel();
        document.getElementById("email").value = "";
        document.getElementById("puzzelAns").value = "";
        errorDiv.textContent = "";
        setInterval(() => (window.location.href = "signin.html"), 4000);
        // alert("If you did not receive it, please check spssam or try again.");
      } else {
        throw new Error(data.message || "An error occurred");
      }
    } catch (error) {
      getPuzzel();
      errorDiv.textContent = error.message;
      recoveyLinkBtn.disabled = false;
      recoveyLinkBtn.style.cursor = "pointer";
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
