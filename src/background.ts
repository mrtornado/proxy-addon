// @ts-nocheck
import rules from "./rules";

let contentScriptIsActive = false;

let attachedTabIds = [];

async function setTimezoneForAllTabs(timezone) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(async (tab) => {
    if (!tab.url.startsWith("chrome://") && !attachedTabIds.includes(tab.id)) {
      try {
        attachedTabIds.push(tab.id);
        await chrome.debugger.attach({ tabId: tab.id }, "1.2");
        await chrome.debugger.sendCommand(
          { tabId: tab.id },
          "Emulation.setTimezoneOverride",
          { timezoneId: timezone }
        );
      } catch (error) {
        console.error("Error setting timezone for tab:", error);
      } finally {
        chrome.debugger.detach({ tabId: tab.id });
        attachedTabIds = attachedTabIds.filter((id) => id !== tab.id);
      }
    }
  });
}

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

    case "setTimezone":
      setTimezoneForAllTabs(request.timezone);
      break;

    default:
      return false;
  }

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (contentScriptIsActive && changeInfo.status === "complete") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    }
  });
});
