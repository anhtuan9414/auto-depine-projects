var puzzle_id_g = "";
let appid;
let bName;

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
  var puzzelid = "";
  const signupForm = document.getElementById("signupForm");
  const errorDiv = document.getElementById("error");
  const registerButton = document.getElementById("registerButton");

  const passwordInput = document.getElementById("password");
  const cnfpassword = document.getElementById("cnfpassword");
  const passwordWarning = document.getElementById("passwordwarning");
  const passwordmatchwarning = document.getElementById("passwordmatchwarning");
  const username = document.getElementById("username");
  const emailvalidwarning = document.getElementById("emailvalidwarning");
  const tearmsAndConditionWarning = document.getElementById(
    "tearmsAndConditionWarning"
  );
  const tearmsAndCondition = document.getElementById("checkbox");
  username.addEventListener("input", async function () {
    let isValidemail = isValidEmail(username.value);

    if (isValidemail) {
      emailvalidwarning.textContent = "";
    } else {
      emailvalidwarning.textContent =
        "Please confirm that your email is correct";
      emailvalidwarning.classList.add("red");
      if (username.value.length == 0) {
        emailvalidwarning.textContent = "";
      }
    }
  });

  passwordInput.addEventListener("input", function () {
    if (this.value.length < 8) {
      passwordWarning.classList.remove("green");
      passwordWarning.classList.add("red");
      return;
    } else {
      passwordWarning.classList.remove("red");
      passwordWarning.classList.add("green");
    }
    if (cnfpassword.value != this.value) {
      passwordmatchwarning.classList.remove("green");
      passwordmatchwarning.classList.add("red");
    } else {
      passwordmatchwarning.classList.remove("red");
      passwordmatchwarning.classList.add("green");
    }
  });
  cnfpassword.addEventListener("input", function () {
    if (passwordInput.value != this.value) {
      passwordmatchwarning.textContent = "Passwords do not match!";
      passwordmatchwarning.classList.remove("green");
      passwordmatchwarning.classList.add("red");
    } else {
      if (passwordInput.value.length < 8) {
      } else {
        passwordmatchwarning.textContent = "Passwords match!";
        passwordmatchwarning.classList.remove("red");
        passwordmatchwarning.classList.add("green");
      }
    }
  });
  tearmsAndCondition.addEventListener("input", function () {
    if (tearmsAndCondition.checked) {
      tearmsAndConditionWarning.textContent = "";
    }
  });

  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    var email = "";
    var mobile = "";
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const cnfpassword = document.getElementById("cnfpassword").value;
    const fullname = document.getElementById("fullname").value;
    const refercode = document.getElementById("refercode").value;
    const puzzelAns = document.getElementById("puzzelAns").value;
    const ismarketing = document.getElementById("ismarketing").checked;

    const tearmsAndConditionWarning = document.getElementById(
      "tearmsAndConditionWarning"
    );
    const tearmsAndCondition = document.getElementById("checkbox");
    registerButton.disabled = true;
    registerButton.style.cursor = "not-allowed";
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (password === cnfpassword) {
    } else {
      alert("password and confirm password must be matched");
      return;
    }
    if (!tearmsAndCondition.checked) {
      tearmsAndConditionWarning.textContent =
        "Please accept the Terms & Conditions";
      tearmsAndConditionWarning.style.color = "red";
      tearmsAndConditionWarning.style.textAlign = "center";

      return;
    } else {
      tearmsAndConditionWarning.textContent = "";
    }

    var dt = {};
    if (!isValidEmail(username.toLowerCase())) {
      alert("Please Enter valid email!!");
      return;
    }
    if (username.includes("@")) {
      email = username;
      mobile = "";
    } else {
      mobile = username;
      email = "";
    }

    dt = {
      firstname: fullname,
      lastname: fullname,
      email: email.replace(/\s+/g, ""),
      mobile: mobile,
      password: password.replace(/\s+/g, ""),
      country: "+91",
      referralCode: refercode.replace(/\s+/g, ""),
      puzzle_id: puzzle_id_g,
      ans: puzzelAns.replace(/\s+/g, ""),
      ismarketing: ismarketing,
      browserName: bName,
    };

    try {
      const response = await fetch(
        `https://www.aeropres.in/chromeapi/dawn/v1/puzzle/validate-register?appid=${appid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dt),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // alert(
        //   "Registration Success!!, We have sent you a email to verify your Account. Please check your Spam or Junk folder."
        // );
        //window.location.href = "registersuccess.html";
        //     chrome.storage.local.set({ "username":email }, () => {

        //       });
      
        chrome.storage.local.set({ tempusername: username }, () => {
          window.location.href = "registersuccess.html";
        });
      } else {
        if (data.data != undefined) {
          //errorDiv.textContent = error.dt.data.message;
          throw new Error(data.data.message || "An error occurred");
        } else {
          throw new Error(data.message || "An error occurred");
        }
      }
    } catch (error) {
      errorDiv.textContent = error.message;
      registerButton.disabled = false;
      registerButton.style.cursor = "pointer";
      getPuzzel();

      if (error.message == "email already exists") {
        errorDiv.textContent = "Email Already Registered";
      }
      if (error.message == "refresh your captcha!!") {
        errorDiv.textContent = "Please Enter Your Captcha Again!";
      }
      if (error.message == "Incorrect answer. Try again!") {
        errorDiv.textContent = "Incorrect answer. Try again!";
      }
    }
  });
  document
    .getElementById("captcha-Refresh")
    .addEventListener("click", async () => {
      getPuzzel();
    });
  document.getElementById("refercode").addEventListener("input", async () => {
    let referralCode = document.getElementById("refercode").value;
    if (referralCode.length == 0) {
      document.getElementById("iscodeexist").textContent = "";
      return;
    }
    await checkReferralCode(referralCode);
  });
  getPuzzel();
  {
    var OSName = "Unknown OS";
    if (navigator.userAgent.indexOf("Win") != -1) OSName = "Windows";
    if (navigator.userAgent.indexOf("Mac") != -1) OSName = "Macintosh";
    if (navigator.userAgent.indexOf("Linux") != -1) OSName = "Linux";
    if (navigator.userAgent.indexOf("Android") != -1) OSName = "Android";
    if (navigator.userAgent.indexOf("like Mac") != -1) OSName = "iOS";
    console.log("Your OS: " + OSName);
  }
  var nAgt = navigator.userAgent;
  var browserName = navigator.appName;
  var fullVersion = "" + parseFloat(navigator.appVersion);
  var nameOffset, verOffset;

  // In Opera, the true version is after "OPR" or after "Version"
  if ((verOffset = nAgt.indexOf("OPR")) != -1) {
    browserName = "Opera";
    fullVersion = nAgt.substring(verOffset + 4);
    if ((verOffset = nAgt.indexOf("Version")) != -1)
      fullVersion = nAgt.substring(verOffset + 8);
  }
  // In MS Edge, the true version is after "Edg" in userAgent
  else if ((verOffset = nAgt.indexOf("Edg")) != -1) {
    browserName = "Microsoft Edge";
    fullVersion = nAgt.substring(verOffset + 4);
  }
  // In MSIE, the true version is after "MSIE" in userAgent
  else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
    browserName = "Microsoft Internet Explorer";
    fullVersion = nAgt.substring(verOffset + 5);
  }
  // In Chrome, the true version is after "Chrome"
  else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
    browserName = "Chrome";
    fullVersion = nAgt.substring(verOffset + 7);
  }
  // In Safari, the true version is after "Safari" or after "Version"
  else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
    browserName = "Safari";
    fullVersion = nAgt.substring(verOffset + 7);
    if ((verOffset = nAgt.indexOf("Version")) != -1)
      fullVersion = nAgt.substring(verOffset + 8);
  }
  // In Firefox, the true version is after "Firefox"
  else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
    browserName = "Firefox";
    fullVersion = nAgt.substring(verOffset + 8);
  }
  // In most other browsers, "name/version" is at the end of userAgent
  else if (
    (nameOffset = nAgt.lastIndexOf(" ") + 1) <
    (verOffset = nAgt.lastIndexOf("/"))
  ) {
    browserName = nAgt.substring(nameOffset, verOffset);
    fullVersion = nAgt.substring(verOffset + 1);
    if (browserName.toLowerCase() == browserName.toUpperCase()) {
      browserName = navigator.appName;
    }
  }
  bName = browserName;

  console.log("" + "Browser name  = " + browserName);
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
async function checkReferralCode(referralCode) {
  try {
    const response = await fetch(
      `https://www.aeropres.in/api/atom/v1/userreferral/iscodeexist?referralCode=${referralCode}&appid=${appid}`
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    document.getElementById("iscodeexist").textContent = "";
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
    document.getElementById("iscodeexist").textContent =
      "Referral code do not exist.";
    document.getElementById("iscodeexist").classList.add("red");
    if (document.getElementById("refercode").value.length == 0) {
      document.getElementById("iscodeexist").textContent = "";
    }
  }
}
