// @ts-nocheck
import rules from "./rules";

let contentScriptIsActive = false;

let activeProxy = null;

chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get({ proxies: [] }, (data) => {
        resolve(data);
      });
    });
    activeProxy = result.proxies.find((proxy) => proxy.isActive);

    if (activeProxy) {
      const activeProxyPort = parseInt(activeProxy.port, 10);
      const challengerPort = parseInt(details.challenger.port, 10);

      if (
        activeProxy.host === details.challenger.host &&
        activeProxyPort === challengerPort
      ) {
        const authCredentials = {
          username: activeProxy.username,
          password: activeProxy.password,
        };

        callback({ authCredentials });
      } else {
        callback({ cancel: true });
      }
    } else {
      callback({ cancel: true });
    }
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "activateProxy":
      console.log("activateProxy");
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
          console.log("proxy set");
          chrome.storage.local.get({ proxies: [] }, (result) => {
            let proxies = result.proxies;
            console.log(request);
            proxies.push({ host: request.host, port: request.port });
            chrome.storage.local.set({ proxies: proxies }, () => {
              console.log("proxy saved");
              sendResponse({ success: true }); // Add a response object
            });
          });
        }
      );
      return true;

    case "deactivateProxy":
      console.log("deactivateProxy");
      chrome.proxy.settings.clear(
        {
          scope: "regular",
        },
        () => {
          console.log("proxy settings cleared");
          chrome.storage.local.get({ proxies: [] }, async (result) => {
            console.log("fetched proxies");
            let proxies = result.proxies;
            proxies = proxies.filter(
              (proxy) =>
                proxy.host !== request.host || proxy.port !== request.port
            );
            console.log("filtered proxies");
            await new Promise((resolve) => {
              chrome.storage.local.set({ proxies }, resolve);
            });
            console.log("proxies saved");
            sendResponse({ success: true });
          });
        }
      );
      return true;

    case "activateHeaders":
      chrome.storage.local.get(["proxies", "ua"], (result) => {
        const activeProxy = result.proxies.find((proxy) => proxy.headersActive);
        if (activeProxy) {
          const ua = result.ua;
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
            } else if (rule.id === 3) {
              return {
                ...rule,
                action: {
                  ...rule.action,
                  requestHeaders: [
                    {
                      ...rule.action.requestHeaders[0],
                      value: ua,
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
              sendResponse({ success: true });
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
          sendResponse({ success: true });
        }
      );
      return true;

    case "activateContentScript":
      // Activate the content script
      console.log("Activating content script:", request);
      contentScriptIsActive = true;
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      });
      sendResponse({ success: true });
      break;

    case "deactivateContentScript":
      // Deactivate the content script
      console.log("Deactivating content script:", request);
      contentScriptIsActive = false;
      sendResponse({ success: true });
      break;

    case "deactivateAllProxies":
      deactivateAllProxies()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Error deactivating all proxies:", error);
          sendResponse({ success: false, error: error.message }); // Add an error object to the response
        });
      return true;

    default:
      sendResponse({ success: false });
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

function deactivateAllProxies() {
  return new Promise((resolve, reject) => {
    console.log("Deactivating all proxies");
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        console.log("Error while deactivating all proxies");
        reject(chrome.runtime.lastError);
      } else {
        console.log("All proxies deactivated");
        resolve();
      }
    });
  });
}
