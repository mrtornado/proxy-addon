// @ts-nocheck
import rules from "./rules";

let contentScriptIsActive = false;

let activeProxy = null;

chrome.webRequest.onAuthRequired.addListener(
  (details, callback) => {
    console.log("Details:", details);
    console.log("Active Proxy:", activeProxy);

    chrome.storage.local.get({ proxies: [] }, (result) => {
      activeProxy = result.proxies.find((proxy) => proxy.isActive);
    });

    if (activeProxy) {
      const activeProxyPort = parseInt(activeProxy.port, 10);
      const challengerPort = parseInt(details.challenger.port, 10);

      console.log(
        "Active Proxy Host:",
        activeProxy.host,
        "Challenger Host:",
        details.challenger.host
      );
      console.log(
        "Active Proxy Port:",
        activeProxyPort,
        "Challenger Port:",
        challengerPort
      );

      if (
        activeProxy.host === details.challenger.host &&
        activeProxyPort === challengerPort
      ) {
        const authCredentials = {
          username: activeProxy.username,
          password: activeProxy.password,
        };

        console.log("Auth Credentials:", authCredentials);
        callback({ authCredentials });
      } else {
        console.log("Proxy and Challenger do not match.");
        callback({ cancel: true });
      }
    } else {
      console.log("No Active Proxy found.");
      callback({ cancel: true });
    }
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "activateProxy":
      chrome.proxy.settings.set(
        {
          value: {
            mode: "fixed_servers",
            rules: {
              singleProxy: {
                scheme: "http",
                host: request.host,
                port: parseInt(request.port),
              },
            },
          },
          scope: "regular",
        },
        () => {
          chrome.storage.local.get({ proxies: [] }, (result) => {
            let proxies = result.proxies;
            console.log(request);
            proxies.push({ host: request.host, port: request.port });
            chrome.storage.local.set({ proxies: proxies }, () => {
              sendResponse();
            });
          });
        }
      );
      return true;

    case "deactivateProxy":
      chrome.proxy.settings.clear(
        {
          scope: "regular",
        },
        () => {
          chrome.storage.local.get({ proxies: [] }, (result) => {
            let proxies = result.proxies;
            proxies = proxies.filter(
              (proxy) =>
                proxy.host !== request.host || proxy.port !== request.port
            );
            chrome.storage.local.set({ proxies: proxies }, () => {
              sendResponse();
            });
          });
        }
      );
      return true;

    case "activateHeaders":
      chrome.storage.local.get(["proxies"], (result) => {
        const activeProxy = result.proxies.find((proxy) => proxy.headersActive);
        if (activeProxy) {
          const modifiedRules = rules.map((rule) => {
            if (rule.id === 1) {
              return {
                ...rule,
                action: {
                  ...rule.action,
                  requestHeaders: [
                    {
                      ...rule.action.requestHeaders[0],
                      value: activeProxy.language,
                    },
                  ],
                },
              };
            } else if (rule.id === 2) {
              return {
                ...rule,
                action: {
                  ...rule.action,
                  requestHeaders: [
                    {
                      ...rule.action.requestHeaders[0],
                      value: activeProxy.timezone,
                    },
                  ],
                },
              };
            }
            return rule;
          });
          console.log("Activating headers:", modifiedRules);
          chrome.declarativeNetRequest.updateDynamicRules(
            {
              addRules: modifiedRules,
            },
            () => {
              sendResponse();
            }
          );
        }
      });
      return true;

    case "deactivateHeaders":
      console.log(
        "Deactivating headers:",
        rules.map((rule) => rule.id)
      );
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          removeRuleIds: rules.map((rule) => rule.id),
        },
        () => {
          sendResponse();
        }
      );
      return true;

    case "activateContentScript":
      // Activate the content script
      console.log("Activating content script");
      contentScriptIsActive = true;
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      });
      break;

    case "deactivateContentScript":
      // Deactivate the content script
      console.log("Deactivating content script");
      contentScriptIsActive = false;
      break;

    default:
      return false;
  }

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      contentScriptIsActive &&
      changeInfo.status === "complete" &&
      !tab.url.startsWith("chrome://")
    ) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    }
  });
});
