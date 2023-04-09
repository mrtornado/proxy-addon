// @ts-nocheck
import rules from "./rules";

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
      const language = request.language;
      console.log("Activating headers:", rules);
      chrome.declarativeNetRequest.updateDynamicRules(
        {
          addRules: rules,
        },
        () => {
          sendResponse();
        }
      );
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

    default:
      return false;
  }
});
