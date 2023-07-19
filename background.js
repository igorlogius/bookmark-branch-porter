/* global browser */

browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
