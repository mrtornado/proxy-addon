import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import { DefaultButton } from "./Buttons";
import React from "react";

declare const chrome: any;

interface Proxy {
  host: string;
  port: string;
  username?: string | null;
  password?: string | null;
  isActive: boolean;
  headersActive: boolean;
  language?: string;
  timezone?: string;
}

function getProxyCredentials(
  callback: (credentials: {
    username: string | null;
    password: string | null;
  }) => void
) {
  chrome.storage.local.get(
    "proxies",
    (storage: { proxies: { username: any; password: any } }) => {
      if (storage.proxies) {
        const { username, password } = storage.proxies;
        callback({ username, password });
      } else {
        callback({ username: null, password: null });
      }
    }
  );
}

function ProxyForm() {
  const [directPageInput, setDirectPageInput] = useState("");
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserAgent, setSelectedUserAgent] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const proxiesPerPage = 10;

  useEffect(() => {
    if (typeof chrome !== "undefined") {
      // Do something with chrome
      chrome.storage.local.get(["proxies"], (result: { proxies: never[] }) => {
        const storedProxies = result.proxies || [];
        setProxies(storedProxies);
      });

      chrome.storage.local.get(
        "userAgent",
        (result: { userAgent: string[] }) => {
          setUserAgent(result.userAgent);
        }
      );

      chrome.storage.local.get("ua", (result: { ua: any }) => {
        setSelectedUserAgent(result.ua || "");
      });
    }
  }, []);

  useEffect(() => {
    if (typeof chrome !== "undefined") {
      // Do something with chrome
      chrome.storage.local.set({ ua: selectedUserAgent });
    }
  }, [selectedUserAgent]);

  useEffect(() => {
    if (typeof chrome !== "undefined") {
      // Do something with chrome
      chrome.storage.local.set({ proxies });
    }
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

    const existingProxy = proxies.find((proxy) => proxy.host === host);
    if (existingProxy) {
      alert("This proxy host is already in the list");
      return;
    }

    const newProxy = { host, port, isActive: false, headersActive: false };
    setProxies((prevProxies) => [...prevProxies, newProxy]);
    setHost("");
    setPort("");
  }

  const handlePageChange = (pageNumber: any) => {
    if (
      pageNumber >= 1 &&
      pageNumber <= Math.ceil(proxies.length / proxiesPerPage)
    ) {
      setCurrentPage(pageNumber);
    }
  };

  function getPageNumbers() {
    const totalPages = Math.ceil(proxies.length / proxiesPerPage);
    const pageNumbers = [];

    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (startPage > 1) {
      pageNumbers.unshift(1);
      pageNumbers.splice(1, 0, "..." as any);
    }
    if (endPage < totalPages) {
      pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  }

  const handleDirectPageInputChange = (event: any) => {
    setDirectPageInput(event.target.value);
  };

  const handleDirectPageSubmit = (event: any) => {
    event.preventDefault();
    const pageNumber = parseInt(directPageInput);
    if (
      pageNumber >= 1 &&
      pageNumber <= Math.ceil(proxies.length / proxiesPerPage)
    ) {
      setCurrentPage(pageNumber);
    }
    setDirectPageInput("");
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const indexOfLastProxy = currentPage * proxiesPerPage;
  const indexOfFirstProxy = indexOfLastProxy - proxiesPerPage;

  // Slice the proxies array to display only the proxies for the current page
  const currentProxies = proxies.slice(indexOfFirstProxy, indexOfLastProxy);

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
    const [proxyHost, proxyPort] = host.split(":");

    // Fetch the language and timezone if it's not already available in the proxy object
    try {
      if (!language || !timezone || timezone === "UTC") {
        const response = await fetch(`https://ipapi.co/${host}/json/`);
        const data = await response.json();
        language = data.languages.split(",")[0];
        timezone = data.timezone;
      }
    } catch (error) {
      console.error(error);
      language = "en";
      timezone = "UTC";
    }

    getProxyCredentials((credentials) => {
      const { username, password } = credentials;

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
    });
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
        setProxies((prevProxies) => {
          const newProxies = prevProxies.filter((_, i) => i !== index);
          // Update the isActive property of the remaining proxies
          newProxies.forEach((proxy, i) => {
            if (i !== index) {
              proxy.isActive = false;
            }
          });
          return newProxies;
        });
        chrome.runtime.sendMessage({
          type: "deactivateHeaders",
          host: proxy.host,
          port: proxy.port,
        });
        chrome.runtime.sendMessage({ type: "deactivateContentScript" });
      });
    } else {
      setProxies((prevProxies) => prevProxies.filter((_, i) => i !== index));
    }
  }

  const handleRemoveAllProxies = () => {
    if (window.confirm("Are you sure you want to remove all proxies?")) {
      chrome.runtime.sendMessage({ type: "deactivateProxy" }, () => {
        setProxies([]);
        chrome.runtime.sendMessage({ type: "deactivateHeaders" });
        chrome.runtime.sendMessage({ type: "deactivateContentScript" });
      });
    }
  };

  const handleSelectUserAgent = (event: any) => {
    const selected = event.target.value;
    setSelectedUserAgent(selected);
    handleCloseModal();
  };

  const handleRemoveUserAgent = () => {
    if (selectedUserAgent) {
      setUserAgent(userAgent.filter((ua) => ua !== selectedUserAgent));
      setSelectedUserAgent("");
      chrome.storage.local.set({
        userAgent: userAgent.filter((ua) => ua !== selectedUserAgent),
      });
    }
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  function parseProxyLine(line: string) {
    const parts = line.split(":");
    const proxy = {
      ip: parts[0],
      port: parts[1],
      username: parts[2] || null,
      password: parts[3] || null,
      headersActive: true,
    };
    return proxy;
  }

  function handleAddProxiesFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/);
      const newProxies = lines
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const proxy = parseProxyLine(line);
          if (!proxy) {
            console.error(`Error parsing proxy from line: ${line}`);
          }
          return proxy;
        })
        .filter(Boolean)
        .map((proxy) => ({
          host: `${proxy.ip}`,
          isActive: false,
          ...proxy,
        }));
      setProxies((prevState) => [...prevState, ...newProxies]);
    };
    reader.readAsText(file);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      handleAddProxiesFromFile(file);
    }
  }

  //TODO: make sure it works on first press of the button because of the map.
  useEffect(() => {
    if (typeof chrome !== "undefined") {
      const userAgentList = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.43",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:111.0) Gecko/20100101 Firefox/111.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.2; rv:111.0) Gecko/20100101 Firefox/111.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.43",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.2; rv:102.0) Gecko/20100101 Firefox/102.0",
      ];

      chrome.storage.local.get("userAgent", (result: { userAgent: any }) => {
        function arraysEqual(a1: string[], a2: string[]) {
          return JSON.stringify(a1) === JSON.stringify(a2);
        }

        if (
          !result.userAgent ||
          !arraysEqual(result.userAgent, userAgentList)
        ) {
          chrome.storage.local.set({ userAgent: userAgentList });
        }
        setUserAgent(result.userAgent || []);
      });
    }
  }, [handleShowModal]);

  return (
    <div>
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
        <DefaultButton onClick={handleAddProxy}>Add Proxy</DefaultButton>
        <div>
          <DefaultButton onClick={handleShowModal}>
            Change UserAgent
          </DefaultButton>
          <Modal
            showModal={showModal}
            selectedUserAgent={selectedUserAgent}
            userAgent={userAgent}
            handleCloseModal={handleCloseModal}
            handleSelectUserAgent={handleSelectUserAgent}
            handleRemoveUserAgent={handleRemoveUserAgent}
          />
        </div>
      </div>
      <DefaultButton
        className="text-red-500 hover:bg-red-500 hover:text-white dark:text-white"
        onClick={handleRemoveAllProxies}
      >
        Remove All Proxies
      </DefaultButton>

      <DefaultButton onClick={() => inputFileRef.current?.click()}>
        Add Proxies from File
      </DefaultButton>
      <input
        ref={inputFileRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        accept=".txt"
      />

      <div>
        {currentProxies.map((proxy, relativeIndex) => {
          const absoluteIndex =
            (currentPage - 1) * proxiesPerPage + relativeIndex;

          return (
            <div
              key={absoluteIndex}
              className={`${
                proxy.isActive
                  ? "bg-gradient-to-br from-green-400 to-blue-600"
                  : ""
              }`}
            >
              <div key={absoluteIndex} className="flex flex-wrap items-center">
                <div>
                  <p className="ml-2 mb-1 mt-1 text-[#fffed8] text-lg">{`IP${
                    absoluteIndex + 1
                  }: ${proxy.host}:${proxy.port}`}</p>
                </div>
                {proxy.isActive ? (
                  <div className="ml-auto">
                    <DefaultButton
                      onClick={() => handleDeactivateProxy(absoluteIndex)}
                    >
                      Deactivate
                    </DefaultButton>
                  </div>
                ) : (
                  <div className="ml-auto">
                    <DefaultButton
                      onClick={() => handleActivateProxy(absoluteIndex)}
                    >
                      Activate
                    </DefaultButton>
                  </div>
                )}
                <div>
                  <DefaultButton
                    onClick={() => handleRemoveProxy(absoluteIndex)}
                  >
                    Remove
                  </DefaultButton>
                </div>
                <div>
                  <DefaultButton
                    onClick={() => handleHeaderActivation(absoluteIndex)}
                  >
                    {proxy.headersActive
                      ? "Deactivate Headers"
                      : "Activate Headers"}
                  </DefaultButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center mt-4">
        {currentPage > 1 && (
          <DefaultButton onClick={handlePreviousPage}>Prev</DefaultButton>
        )}
        {proxies.length > proxiesPerPage &&
          getPageNumbers().map((number, index) => (
            <div key={index} className="items-center">
              {number === "..." ? (
                <span className="mx-2 text-gray-600">...</span>
              ) : (
                <a
                  className="mx-2 text-green-500 cursor-pointer"
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </a>
              )}
            </div>
          ))}
        {currentPage < Math.ceil(proxies.length / proxiesPerPage) && (
          <React.Fragment>
            <DefaultButton onClick={handleNextPage}>Next</DefaultButton>
            <form
              onSubmit={handleDirectPageSubmit}
              className="flex items-center"
            >
              <input
                type="number"
                min="1"
                max={Math.ceil(proxies.length / proxiesPerPage)}
                value={directPageInput}
                onChange={handleDirectPageInputChange}
                className="mx-2 w-16 h-6 border border-gray-300 rounded text-center"
                placeholder="Page"
              />
              <DefaultButton type="submit">Go</DefaultButton>
            </form>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

export default ProxyForm;
