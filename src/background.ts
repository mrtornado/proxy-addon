// @ts-nocheck
import rules from "./rules";

let contentScriptIsActive = false;

let activeProxy = null;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install" || details.reason === "update") {
    // Call function to clear active proxies
    await deactivateAllProxies();
  }
});

function disableExt() {
  self.mo?.disconnect?.();
  delete self.mo;
  delete self.observe;
}

function changeWebRTCPolicy(override = false, desiredState = null) {
  const pn = chrome.privacy.network;
  const pi = chrome.privacy.IPHandlingPolicy;

  // Function to set policy
  const setPolicy = (enable) => {
    const policy = enable
      ? pi.DISABLE_NON_PROXIED_UDP
      : pi.DEFAULT_PUBLIC_INTERFACE_ONLY;
    pn.webRTCIPHandlingPolicy.set({ value: policy }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error changing WebRTC policy:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("WebRTC policy updated to:", policy);
        console.log(
          "WebRTC policy is now",
          enable
            ? "enabled (restricted to non-proxied UDP)"
            : "disabled (default public interface only)"
        );
      }
    });
  };

  if (override) {
    // If overriding, use the provided desiredState
    setPolicy(desiredState === "enable");
  } else {
    // Otherwise, check the current status from local storage
    chrome.storage.local.get(["webRTC"], (result) => {
      const isEnabled = result.webRTC === "enabled";
      setPolicy(isEnabled);
    });
  }
}

async function updateIcon() {
  // Use a promise to fetch settings concurrently for proxies, user agent, iframes, and webRTC
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(["proxies", "ua", "iframes", "webRTC"], (data) => {
      resolve(data);
    });
  });

  let iconPath = "/assets/icons/32x32-default.png"; // Default icon

  // Ensure that proxies is an array before attempting to find an active proxy
  const proxies = Array.isArray(result.proxies) ? result.proxies : [];
  const activeProxy = proxies.find((proxy) => proxy.isActive);

  // Check settings for iframes and webRTC
  const iframesEnabled = result.iframes === "enabled";
  const webRTCEnabled = result.webRTC === "enabled";
  const ua = result.ua;

  // Determine icon based on proxy and headers status
  if (activeProxy) {
    if (webRTCEnabled && iframesEnabled && activeProxy.headersActive) {
      iconPath = "/assets/icons/32x32-active-full.png"; // All conditions are met: Full active state
    } else if (
      activeProxy.headersActive &&
      (webRTCEnabled || iframesEnabled || ua)
    ) {
      iconPath = "/assets/icons/32x32-active-medium.png"; // At least one condition and headers are active: Medium active state
    } else {
      iconPath = "/assets/icons/32x32-active-low.png"; // Proxy is active but no headers or conditions fully met: Low active state
    }
  }

  // Update the browser action icon
  chrome.action.setIcon({ path: iconPath });
}

// Consider calling updateIcon after a short delay on startup
setTimeout(updateIcon, 1000);

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
            proxies.forEach((proxy) => (proxy.isActive = false));

            // Add and activate the new proxy
            proxies.push({
              host: request.host,
              port: request.port,
              isActive: true,
            });

            // Check if ua key is an empty string, null, or doesn't exist at all
            // if (!result.ua) {
            //   result.ua = navigator.userAgent;
            // }
            // so I removed this ua shit when proxy is activating make sure you didn't broke anything :)) the line below has to be  { proxies: proxies, ua: result.ua}

            chrome.storage.local.set(
              { proxies: proxies }, // ua: result.ua
              () => {
                sendResponse({ success: true }); // Add a response object
                updateIcon();
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

            proxies.forEach((proxy) => {
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
            updateIcon();
          });
        }
      );
      return true;

    case "activateHeaders":
      (async () => {
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(["proxies", "ua"], (data) => {
            resolve(data);
          });
        });

        const activeProxy = result.proxies.find((proxy) => proxy.isActive);
        if (activeProxy) {
          const ua = result.ua || navigator.userAgent;
          const sec = ua.includes("Mac") ? "macOS" : "Windows";

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

          // Now, activate the content script
          await chrome.scripting.registerContentScripts([
            {
              id: "remove-iframe",
              js: ["content.js"],
              matches: ["<all_urls>"],
              runAt: "document_start",
            },
          ]);

          // Execute the script on all current tabs
          const tabs = await chrome.tabs.query({});
          tabs.forEach(({ id }) => {
            chrome.scripting
              .executeScript({ target: { tabId: id }, files: ["content.js"] })
              .catch(() => {});
          });

          // Update dynamic rules
          chrome.declarativeNetRequest.updateDynamicRules(
            {
              addRules: modifiedRules,
              removeRuleIds: modifiedRules.map((rule) => rule.id),
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error updating rules:",
                  chrome.runtime.lastError.message
                );
              } else {
                console.log("Header Rules successfully updated");
              }
              sendResponse({ success: true });
              changeWebRTCPolicy();
              updateIcon();
            }
          );
        }
      })();
      return true;

    case "deactivateHeaders":
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          removeRuleIds: rules.map((rule) => rule.id),
        },
        async () => {
          // Now, deactivate the content script
          await chrome.scripting
            .unregisterContentScripts({ ids: ["remove-iframe"] })
            .catch(() => {});

          // Optionally, deactivate the script on all current tabs
          const allTabs = await chrome.tabs.query({});
          allTabs.forEach(({ id }) => {
            chrome.scripting
              .executeScript({ target: { tabId: id }, func: disableExt })
              .catch(() => {});
          });
          sendResponse({ success: true });
          changeWebRTCPolicy(true, "disable");
          updateIcon();
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
      updateIcon();
      break;

    case "deactivateContentScript":
      // Deactivate the content script
      contentScriptIsActive = false;
      sendResponse({ success: true });
      updateIcon();
      break;

    case "deactivateAllProxies":
      deactivateAllProxies()
        .then(() => {
          sendResponse({ success: true });
          updateIcon();
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
});

function deactivateAllProxies() {
  return new Promise((resolve, reject) => {
    // First, clear the proxy settings
    chrome.proxy.settings.clear({ scope: "regular" }, async () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      // Next, handle the deactivation of headers
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: rules.map((rule) => rule.id),
        });

        // Clearing the proxy was successful, now update the proxies' state in local storage
        chrome.storage.local.get({ proxies: [] }, (result) => {
          const updatedProxies = result.proxies.map((proxy) => ({
            ...proxy,
            isActive: false,
            headersActive: false, // Assuming each proxy has a 'headersActive' property
          }));

          chrome.storage.local.set({ proxies: updatedProxies }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        // Update the icon to reflect the deactivated state
        updateIcon();
      } catch (error) {
        console.error("Error deactivating headers:", error);
        reject(error);
      }
    });
  });
}
