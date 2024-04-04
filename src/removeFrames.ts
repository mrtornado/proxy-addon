//@ts-nocheck
export {};

// Always check state on script load or reload

function removeIframes(element) {
  element.querySelectorAll("iframe").forEach(function (element) {
    element.parentNode.removeChild(element);
    chrome.runtime.sendMessage({
      action: "iframeRemoved",
    });
  });
}

function observeMutations() {
  const observer = new MutationObserver(function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function (addedNode) {
          if (addedNode instanceof Element) {
            removeIframes(addedNode);
          }
        });
      }
    }
  });

  // Observe changes in the <html> element
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

chrome.storage.sync.get({ extensionState: "deactivated" }, (data) => {
  if (data.extensionState === "activated") {
    // Activate iframe removal
    observeMutations();
    removeIframes(document); // Immediately remove existing iframes
  } else {
    console.log("Headers are deactivated, not removing iframes.");
  }
});

//Activation check

chrome.storage.sync.get(
  {
    extensionState: "deactivated",
  },
  function (data) {
    const extensionState = data.extensionState;

    if (extensionState === "activated") {
      chrome.storage.sync.get(
        {
          list: [],
        },
        function (items) {
          const currentLocation = parent.window.location.hostname;
          const whitelist = Array.isArray(items.list) ? items.list : [];

          if (whitelist === undefined || whitelist.length == 0) {
            // If whitelist is empty, observe mutations and remove iframes
            console.log("WhiteList Empty, but we remove iframes anyway.");
            observeMutations();
            //remove other iframes that observe mutations missed
            setInterval(function () {
              document.querySelectorAll("iframe").forEach(function (element) {
                element.parentNode.removeChild(element);
              });
            }, 100);
          } else {
            if (whitelist.includes(currentLocation)) {
              console.log("Domain is whitelisted. Dont remove iframes.");
              chrome.runtime.sendMessage({
                action: "updateWhitelistStatus",
                isWhitelisted: true,
              });
            } else {
              console.log("Default - Remove Iframes");
              // Observe mutations and remove iframes
              observeMutations();
              //remove other iframes that observe mutations missed
              setInterval(function () {
                document.querySelectorAll("iframe").forEach(function (element) {
                  element.parentNode.removeChild(element);
                });
              }, 100);
            }
          }
        }
      );
    } else {
      console.log("Extension is currently deactivated");

      chrome.runtime.sendMessage({
        action: "extensionDeactivated",
      });
    }
  }
);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getCurrentDomain") {
    const currentDomain = window.location.hostname;
    sendResponse({
      currentDomain,
    });
  }
});
