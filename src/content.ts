//@ts-nocheck
export {};
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.type === "toggleContentScript") {
    console.log("Toggling headers:", request.activate);
    toggleHeaders(request.activate);

    // Acknowledge the message received
    sendResponse({ success: true });
  }
});

function toggleHeaders(activate) {
  if (activate) {
    // Save the original navigator object before making changes
    if (!window.originalNavigator) {
      window.originalNavigator = window.navigator;
    }
    var s = document.createElement("script");
    s.src = chrome.runtime.getURL("navigator.js");
    s.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
    // Override the navigator object
  } else {
    // Restore the original navigator object
    window.navigator = window.originalNavigator;
  }
}
