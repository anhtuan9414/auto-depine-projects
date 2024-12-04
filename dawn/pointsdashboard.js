let twitter_x_id_points = 0;
let discordid_points = 0;
let telegramid_points = 0;
let total_points = 0;
let refrral_points = 0;
let lastUpdatedTime;
chrome.storage.local.get(["lastUpdatedTime"], function (result) {
  if (
    result.lastUpdatedTime !== undefined &&
    result.lastUpdatedTime !== null &&
    result.lastUpdatedTime !== ""
  ) {
    lastUpdatedTime = result.lastUpdatedTime;
  }
});
chrome.storage.local.get(["twitter_x_id_points"], function (result) {
  if (
    result.twitter_x_id_points !== undefined &&
    result.twitter_x_id_points !== null &&
    result.twitter_x_id_points !== ""
  ) {
    twitter_x_id_points = result.twitter_x_id_points;
  }
});
chrome.storage.local.get(["telegramid_points"], function (result) {
  if (
    result.telegramid_points !== undefined &&
    result.telegramid_points !== null &&
    result.telegramid_points !== ""
  ) {
    telegramid_points = result.telegramid_points;
  }
});
chrome.storage.local.get(["discordid_points"], function (result) {
  if (
    result.discordid_points !== undefined &&
    result.discordid_points !== null &&
    result.discordid_points !== ""
  ) {
    discordid_points = result.discordid_points;
  }
});
chrome.storage.local.get(["total_points"], function (result) {
  if (
    result.total_points !== undefined &&
    result.total_points !== null &&
    result.total_points !== ""
  ) {
    total_points = result.total_points;
  }
});
chrome.storage.local.get(["refrral_points"], function (result) {
  if (
    result.refrral_points !== undefined &&
    result.refrral_points !== null &&
    result.refrral_points !== ""
  ) {
    refrral_points = result.refrral_points;
  }
});
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    twitter_x_id_points,
    discordid_points,
    telegramid_points,
    total_points
  );
  const dashboardtoatlpoints = document.getElementById("dashboardtoatlpoints");
  const dashboardtwitterlpoints = document.getElementById(
    "dashboardtwitterlpoints"
  );
  const dashboarddiscordlpoints = document.getElementById(
    "dashboarddiscordlpoints"
  );
  const dashboardtelegramlpoints = document.getElementById(
    "dashboardtelegramlpoints"
  );
  const dashboardreferarallpoints = document.getElementById(
    "dashboardreferarallpoints"
  );
  const lastupdatedatetimepointsdashboard = document.getElementById(
    "lastupdatedatetimepointsdashboard"
  );
  dashboardtoatlpoints.textContent =
    total_points.toLocaleString("en", { useGrouping: true }) + " " + "points";
  dashboardtwitterlpoints.textContent =
    twitter_x_id_points.toLocaleString("en", { useGrouping: true }) +
    " " +
    "points";

  dashboarddiscordlpoints.textContent =
    discordid_points.toLocaleString("en", { useGrouping: true }) +
    " " +
    "points";

  dashboardtelegramlpoints.textContent =
    telegramid_points.toLocaleString("en", { useGrouping: true }) +
    " " +
    "points";
  dashboardreferarallpoints.textContent =
    refrral_points.toLocaleString("en", { useGrouping: true }) + " " + "points";
  lastupdatedatetimepointsdashboard.textContent = formatDate(lastUpdatedTime);
});
function formatDate(dateString) {
  const date = new Date(dateString);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getUTCDate();
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Adjust hours
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

  const ordinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${ordinalSuffix(
    day
  )}, ${year} ${formattedHours}:${formattedMinutes} ${ampm} GMT`;
}
