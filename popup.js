/* global browser */

document.getElementById("impbtn").addEventListener("click", () => {
  browser.windows.create({
    url: ["import-dialog.html"],
    type: "popup",
    width: 300,
    height: 250,
  });
});

document.getElementById("expbtn").addEventListener("click", () => {
  browser.windows.create({
    url: ["export-dialog.html"],
    type: "popup",
    width: 300,
    height: 250,
  });
});
