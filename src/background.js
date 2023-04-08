// @ts-nocheck
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "activateProxy") {
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
        chrome.storage.local.get({ proxyList: [] }, (result) => {
          let proxyList = result.proxyList;
          proxyList.push({ host: request.host, port: request.port });
          chrome.storage.local.set({ proxyList: proxyList }, () => {
            sendResponse(); // <-- This can cause the error
          });
        });
      }
    );
    return true; // <-- Add this line
  } else if (request.type === "deactivateProxy") {
    chrome.proxy.settings.clear(
      {
        scope: "regular",
      },
      () => {
        chrome.storage.local.get({ proxyList: [] }, (result) => {
          let proxyList = result.proxyList;
          proxyList = proxyList.filter(
            (proxy) =>
              proxy.host !== request.host || proxy.port !== request.port
          );
          chrome.storage.local.set({ proxyList: proxyList }, () => {
            sendResponse(); // <-- This can cause the error
          });
        });
      }
    );
    return true; // <-- Add this line
  }
});
