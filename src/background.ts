// @ts-nocheck
import rules from "./rules";

let contentScriptIsActive = false;

let activeProxy = null;

async function updateIcon() {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(["proxies", "ua"], (data) => {
      resolve(data);
    });
  });

  let iconPath = '/assets/icons/32x32-default.png'; // Default icon

  const activeProxy = result.proxies.find(proxy => proxy.isActive);
  const ua = result.ua;

  if (activeProxy) {
    if (ua && activeProxy.headersActive) {
      // If the active proxy has a ua property populated
      iconPath = '/assets/icons/32x32-active-full.png';
    } else if (activeProxy.headersActive || ua) {
      // If headers are active but ua is not populated
      iconPath = '/assets/icons/32x32-active-medium.png';
    } else {
      // Proxy is active but headers and ua are not
      iconPath = '/assets/icons/32x32-active-low.png';
    }
  }

  chrome.action.setIcon({ path: iconPath });
}
// Call updateIcon on extension startup
updateIcon();

chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get({ proxies: [] }, (data) => {
        resolve(data);
      });
    });
    const activeProxy = result.proxies.find((proxy) => proxy.isActive);

    if (activeProxy) {
      const activeProxyPort = parseInt(activeProxy.port, 10);
      const challengerPort = parseInt(details.challenger.port, 10);

      if (
        activeProxy.host === details.challenger.host &&
        activeProxyPort === challengerPort
      ) {
        if (activeProxy.username && activeProxy.password) {
          const authCredentials = {
            username: activeProxy.username,
            password: activeProxy.password,
          };

          callback({ authCredentials });
        } else {
          // Fallback to the default Chrome prompt
          callback();
        }
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
          chrome.storage.local.get({ proxies: [], ua: null }, (result) => {
            let proxies = result.proxies;

        // Deactivate all other proxies
        proxies.forEach(proxy => proxy.isActive = false);

        // Add and activate the new proxy
        proxies.push({ host: request.host, port: request.port, isActive: true });

            // Check if ua key is an empty string, null, or doesn't exist at all
            // if (!result.ua) {
            //   result.ua = navigator.userAgent;
            // }
            // so I removed this ua shit when proxy is activating make sure you didn't broke anything :)) the line below has to be  { proxies: proxies, ua: result.ua}

            chrome.storage.local.set(
              { proxies: proxies}, // ua: result.ua
              () => {
                sendResponse({ success: true }); // Add a response object
                updateIcon()
              }
            );
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
          chrome.storage.local.get({ proxies: [] }, async (result) => {
            let proxies = result.proxies;

            proxies.forEach(proxy => {
              if (proxy.host === request.host && proxy.port === request.port) {
                proxy.isActive = false;
              }
            });

            proxies = proxies.filter(
              (proxy) =>
                proxy.host !== request.host || proxy.port !== request.port
            );
            await new Promise((resolve) => {
              chrome.storage.local.set({ proxies }, resolve);
            });
            sendResponse({ success: true });
            updateIcon()
          });
        }
      );
      return true;

    case "activateHeaders":
      chrome.storage.local.get(["proxies", "ua"], (result) => {
        const activeProxy = result.proxies.find((proxy) => proxy.isActive)
 
        if (activeProxy) {
          const ua = result.ua;
          const sec = result.ua.includes("Mac") ? "macOS" : "Windows";
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
                      value: ua || navigator.userAgent,
                    },
                  ],
                },
              };
            } else if (rule.id === 4) {
              return {
                ...rule,
                action: {
                  ...rule.action,
                  requestHeaders: [
                    {
                      ...rule.action.requestHeaders[0],
                      value: sec,
                    },
                  ],
                },
              };
            }
            return rule;
          });
          chrome.declarativeNetRequest.updateDynamicRules(
            {
              addRules: modifiedRules,
            },
            () => {
              sendResponse({ success: true });
              updateIcon()
            }
          );
        }
      });
      return true;

    case "deactivateHeaders":
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          removeRuleIds: rules.map((rule) => rule.id),
        },
        () => {
          sendResponse({ success: true });
          updateIcon()
        }
      );
      return true;

    case "activateContentScript":
      // Activate the content script
      contentScriptIsActive = true;
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      });
      sendResponse({ success: true });
      updateIcon()
      break;

    case "deactivateContentScript":
      // Deactivate the content script
      contentScriptIsActive = false;
      sendResponse({ success: true });
      updateIcon()
      break;

    case "deactivateAllProxies":
      deactivateAllProxies()
        .then(() => {
          sendResponse({ success: true });
          updateIcon()
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
    chrome.proxy.settings.clear({ scope: "regular" }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
