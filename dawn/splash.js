document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["appid"], function (result) {
    if (
      result.appid !== undefined &&
      result.appid !== null &&
      result.appid !== ""
    ) {
      console.log("app id is not set00", result);
    } else {
      getappToken();
      console.log("app id is  set", result);
    }
  });
  chrome.storage.local.get(["token"], function (result) {
    if (
      result.token !== undefined &&
      result.token !== null &&
      result.token !== ""
    ) {
      console.log("token currently is " + atob(result.token));
      window.location.href = "dashboard.html";
    } else {
      console.log("token is not set");
      setTimeout(() => {
        window.location.href = "onboarding.html";
      }, 2000);
    }
  });
});

async function getappToken() {
  const version = chrome.runtime.getManifest().version;

  try {
    const response = await fetch(
      `https://www.aeropres.in/chromeapi/dawn/v1/appid/getappid?app_v=${version}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(
        response.message || `HTTP error! status: ${response.status}`
      );
    }
    const data = await response.json();

    console.log(data);
    chrome.storage.local.set(
      {
        appid: data.data.appid,
      },
      () => {}
    );
  } catch (error) {
    console.error(
      "There was a problem with the fetch operation:",
      error.message
    );
  }
}
