document.addEventListener("DOMContentLoaded", function () {
  const copyButton = document.getElementById("copyButton");
  const copyTextElement = document.getElementById("myReferralCode");
  const copyboxId = document.getElementById("copyboxId");
  copyboxId.style.display = "none";
  copyButton.addEventListener("click", function () {
    copyTextElement.select();
    copyTextElement.setSelectionRange(0, 99999); // For mobile devices

    try {
      document.execCommand("copy");
      copyboxId.style.display = "block";
      setInterval(() => (copyboxId.style.display = "none"), 6000);

      // alert("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  });

  // const copyButtonLink = document.getElementById("copyButtonLink");
  // const copyTextLinkElement = document.getElementById("myReferralCodeLink");

  // copyButtonLink.addEventListener("click", function () {
  //   copyTextLinkElement.select();
  //   copyTextLinkElement.setSelectionRange(0, 99999); // For mobile devices

  //   try {
  //     document.execCommand("copy");
  //     alert("Copied to clipboard");
  //   } catch (err) {
  //     console.error("Failed to copy: ", err);
  //   }
  // });
});
