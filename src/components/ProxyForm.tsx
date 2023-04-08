import React, { useState, useEffect } from "react";

declare const chrome: any;

interface Proxy {
  host: string;
  port: string;
}

function ProxyForm() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [activeProxyIndex, setActiveProxyIndex] = useState<number | null>(null);

  useEffect(() => {
    const storedProxies = localStorage.getItem("proxies");
    if (storedProxies) {
      setProxies(JSON.parse(storedProxies));
    }
  }, []);

  useEffect(() => {
    const activeProxyIndexStr = localStorage.getItem("activeProxyIndex");
    if (activeProxyIndexStr !== null) {
      setActiveProxyIndex(JSON.parse(activeProxyIndexStr));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("proxies", JSON.stringify(proxies));
  }, [proxies]);

  function isValidIPAddress(ipAddress: string) {
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ipAddress);
  }

  function handleActivate() {
    if (!host || !port) {
      alert("Please enter an IP address and port");
      return;
    }

    if (!isValidIPAddress(host)) {
      alert("Invalid IP address format. Please enter a valid IP address.");
      return;
    }

    const newProxy = { host, port };
    setProxies((prevProxies) => [...prevProxies, newProxy]);
    setHost("");
    setPort("");
  }

  function handleDeactivate(index: number) {
    const proxy = proxies[index];
    if (index === activeProxyIndex) {
      chrome.runtime.sendMessage(
        { type: "deactivateProxy", host: proxy.host, port: proxy.port },
        () => {
          setActiveProxyIndex(null);
          localStorage.setItem("activeProxyIndex", JSON.stringify(null));
        }
      );
    } else {
      setProxies((prevProxies) => prevProxies.filter((_, i) => i !== index));
    }
  }

  function handleActivateProxy(index: number) {
    const { host, port } = proxies[index];
    const [proxyHost, proxyPort, username, password] = host.split(":");
    chrome.runtime.sendMessage(
      { type: "activateProxy", host: proxyHost, port, username, password },
      () => {
        setActiveProxyIndex(index);
        localStorage.setItem("activeProxyIndex", JSON.stringify(index));
      }
    );
  }

  function handleRemoveProxy(index: number) {
    if (index === activeProxyIndex) {
      chrome.runtime.sendMessage({ type: "deactivateProxy" }, () => {
        setActiveProxyIndex(null);
      });
    }
    setProxies((prevProxies) => prevProxies.filter((_, i) => i !== index));
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
          onClick={handleActivate}
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
              <p className="ml-2 text-[#fffed8]">{`Proxy ${index + 1}: ${
                proxy.host
              }:${proxy.port}`}</p>
            </div>
            {index === activeProxyIndex ? (
              <div className="ml-auto">
                <button
                  onClick={() => handleDeactivate(index)}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProxyForm;
