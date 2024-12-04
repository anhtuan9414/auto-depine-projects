var referfriendLink;
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

    referfriendLink =
      "https://www.dawninternet.com/register/?referralCode=" +
      result.referralCode;
  }
});
// document.addEventListener("DOMContentLoaded", function () {
//   const copyButtonDashBoard = document.getElementById("copyButtonDashBoard");
//   const copyTextElement = document.getElementById("referfriendLinkDashboard");
//   const copyiconDashboard = document.getElementById("copyiconDashboard");

//   copyButtonDashBoard.addEventListener("click", function () {
//     navigator.clipboard
//       .writeText(referfriendLink)
//       .then(function () {
//         copyTextElement.innerText = "Link copied!";
//         copyiconDashboard.style.display = "none";
//         copyTextElement.style.alignItems = "center";
//         copyTextElement.style.marginInlineStart = "10px";
//         setTimeout(() => {
//           copyTextElement.innerText = "Refer a friend";
//           copyiconDashboard.style.display = "block";
//           copyiconDashboard.style.display = "block";
//           copyTextElement.style.marginInlineStart = "0px";
//         }, 5000);
//       })
//       .catch(function (err) {
//         console.error("Failed to copy: ", err);
//       });
//   });
// });
