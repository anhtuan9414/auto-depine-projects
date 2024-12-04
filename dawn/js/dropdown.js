//show and hide dropdown list item on button click
document.addEventListener("DOMContentLoaded", () => {
    const idclick = document.getElementById("idclick");
    const dropdown = document.getElementById("list-items");
    const closeIcon = document.getElementById("closeiconclick");
  
    idclick.addEventListener("click", (event) => {
      event.preventDefault();
      if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
        closeIcon.style.display = "block";
        idclick.style.display = "none";
      } else {
        dropdown.style.display = "none";
        closeIcon.style.display = "none";
        idclick.style.display = "block";
      }
    });
    // Hide dropdown and show menu icon when close icon is clicked
    closeIcon.addEventListener("click", () => {
      dropdown.style.display = "none";
      closeIcon.style.display = "none";
      idclick.style.display = "block";
    });
  
    // Close the dropdown if clicked outside
    document.addEventListener("click", (event) => {
      const isClickInside =
        idclick.contains(event.target) || dropdown.contains(event.target);
      if (!isClickInside) {
        dropdown.style.display = "none";
        closeIcon.style.display = "none";
        idclick.style.display = "inline";
      }
    });
  });
  