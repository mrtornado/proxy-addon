import { useCallback } from "react";

declare const chrome: any;

async function getActiveProxy(): Promise<any | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get("proxies", (result: any) => {
      const proxies = result.proxies || [];
      const activeProxy = proxies.find(
        (proxy: { isActive: any }) => proxy.isActive
      );
      resolve(activeProxy || null);
    });
  });
}

function useDeactivateActiveProxy() {
  const deactivateActiveProxy = useCallback(async () => {
    const activeProxy = await getActiveProxy();

    if (!activeProxy) {
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get("proxies", (result: any) => {
        const proxies = result.proxies || [];

        const updatedProxies = proxies.map((proxy: any) =>
          proxy.host === activeProxy.host && proxy.port === activeProxy.port
            ? { ...proxy, isActive: false, headersActive: false }
            : proxy
        );

        chrome.runtime.sendMessage(
          {
            type: "deactivateProxy",
            host: activeProxy.host,
            port: activeProxy.port,
          },
          () => {
            chrome.storage.local.set({ proxies: updatedProxies }, () => {
              resolve(updatedProxies);
            });
          }
        );

        chrome.runtime.sendMessage({
          type: "deactivateHeaders",
          host: activeProxy.host,
          port: activeProxy.port,
        });
        chrome.runtime.sendMessage({ type: "deactivateContentScript" });
      });
    });
  }, []);

  return deactivateActiveProxy;
}

export default useDeactivateActiveProxy;
