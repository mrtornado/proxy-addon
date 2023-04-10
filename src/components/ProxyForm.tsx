import { useState, useEffect } from "react";

declare const chrome: any;

interface Proxy {
  host: string;
  port: string;
  username?: string;
  password?: string;
  isActive: boolean;
  headersActive: boolean;
  language?: string;
  timezone?: string;
}

function ProxyForm() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.local.get(["proxies"], (result: { proxies: never[] }) => {
      const storedProxies = result.proxies || [];
      setProxies(storedProxies);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ proxies });
  }, [proxies]);

  function isValidIPAddress(ipAddress: string) {
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ipAddress);
  }

  function handleAddProxy() {
    if (!host || !port) {
      alert("Please enter an IP address and port");
      return;
    }

    if (!isValidIPAddress(host)) {
      alert("Invalid IP address format. Please enter a valid IP address.");
      return;
    }

    const newProxy = { host, port, isActive: false, headersActive: false };
    setProxies((prevProxies) => [...prevProxies, newProxy]);
    setHost("");
    setPort("");
  }

  function handleToggleHeaders(index: number) {
    setProxies((prevProxies) =>
      prevProxies.map((proxy, i) => {
        if (i === index) {
          return { ...proxy, headersActive: !proxy.headersActive };
        }
        return proxy;
      })
    );
  }

  function handleHeaderActivation(index: number) {
    const proxy = proxies[index];

    // Prevent header activation if the proxy is not active
    if (!proxy.isActive) {
      alert("Please activate the proxy before activating headers.");
      return;
    }

    handleToggleHeaders(index);
    const { host, port, headersActive } = proxy;
    const action = headersActive ? "deactivateHeaders" : "activateHeaders";
    const contentScriptAction = headersActive
      ? "deactivateContentScript"
      : "activateContentScript";

    // Send the language as part of the message
    chrome.runtime.sendMessage({
      type: action,
      host,
      port,
      language,
      timezone,
    });

    // Send the contentScriptAction as a separate message
    chrome.runtime.sendMessage({ type: contentScriptAction });
  }

  async function handleActivateProxy(index: number) {
    let { host, port, language, timezone } = proxies[index];
    const [proxyHost, proxyPort, username, password] = host.split(":");

    // Fetch the language and timezone if it's not already available in the proxy object
    if (!language || !timezone) {
      const response = await fetch(`https://ipapi.co/${host}/json/`);
      const data = await response.json();
      language = data.languages.split(",")[0];
      timezone = data.timezone;
    }

    // Deactivate headers and content script for the currently active proxy
    proxies.forEach((proxy, i) => {
      if (proxy.isActive) {
        chrome.runtime.sendMessage({
          type: "deactivateHeaders",
          host: proxy.host,
          port: proxy.port,
        });
        chrome.runtime.sendMessage({ type: "deactivateContentScript" });
      }
    });

    // Activate the new proxy
    chrome.runtime.sendMessage(
      { type: "activateProxy", host: proxyHost, port, username, password },
      () => {
        setProxies((prevProxies) =>
          prevProxies.map((proxy, i) => {
            if (i === index) {
              return { ...proxy, isActive: true, language, timezone };
            } else {
              return { ...proxy, isActive: false, headersActive: false };
            }
          })
        );
      }
    );
  }

  function handleDeactivateProxy(index: number) {
    const proxy = proxies[index];
    chrome.runtime.sendMessage(
      { type: "deactivateProxy", host: proxy.host, port: proxy.port },
      () => {
        setProxies((prevProxies) =>
          prevProxies.map((proxy, i) => {
            if (i === index) {
              return { ...proxy, isActive: false, headersActive: false };
            }
            return proxy;
          })
        );
      }
    );

    // Deactivate headers and content script for the current proxy
    chrome.runtime.sendMessage({
      type: "deactivateHeaders",
      host: proxy.host,
      port: proxy.port,
    });
    chrome.runtime.sendMessage({ type: "deactivateContentScript" });
  }

  function handleRemoveProxy(index: number) {
    const proxy = proxies[index];
    if (proxy.isActive) {
      chrome.runtime.sendMessage({ type: "deactivateProxy" }, () => {
        setProxies((prevProxies) => prevProxies.filter((_, i) => i !== index));
      });
    } else {
      setProxies((prevProxies) => prevProxies.filter((_, i) => i !== index));
    }
  }

  return (
    <div className="min-w-[640]">
      <div className="flex mt-4 ml-4">
        <div>
          <input
            id="host-input"
            type="text"
            placeholder="IP Address"
            className="w-40 p-2 text-[#fffed8] bg-dark border rounded-lg"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </div>
        <div>
          <input
            id="port-input"
            type="text"
            placeholder="Port"
            className="ml-2 w-20 p-2 text-[#fffed8] bg-dark border rounded-lg"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddProxy}
          className="ml-2 inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
        >
          <span className="relative px-2 py-0.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
            Add Proxy
          </span>
        </button>
      </div>
      <div>
        {proxies.map((proxy, index) => (
          <div key={index} className="flex">
            <div>
              <p className="ml-2 text-[#fffed8]">{`IP Address ${index + 1}: ${
                proxy.host
              }:${proxy.port}`}</p>
            </div>
            {proxy.isActive ? (
              <div className="ml-auto">
                <button
                  onClick={() => handleDeactivateProxy(index)}
                  className="ml-2 inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
                >
                  <span className="relative px-2 py-0.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                    Deactivate
                  </span>
                </button>
              </div>
            ) : (
              <div className="ml-auto">
                <button
                  onClick={() => handleActivateProxy(index)}
                  className="ml-2 inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
                >
                  <span className="relative px-2 py-0.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                    Activate
                  </span>
                </button>
              </div>
            )}
            <div>
              <button
                onClick={() => handleRemoveProxy(index)}
                className="ml-2 inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
              >
                <span className="relative px-2 py-0.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                  Remove
                </span>
              </button>
            </div>
            <div>
              <button
                onClick={() => handleHeaderActivation(index)}
                className="ml-2 inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800"
              >
                <span className="relative px-2 py-0.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                  {proxy.headersActive
                    ? "Deactivate Headers"
                    : "Activate Headers"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProxyForm;
