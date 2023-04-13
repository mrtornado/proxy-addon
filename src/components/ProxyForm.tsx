import { useState, useEffect } from "react";
import ProxyInputForm from "./ProxyInputForm";
import PaginationControls from "./PaginationControls";
import ProxiesDisplay from "./ProxiesDisplay";
import { useModal } from "../hooks/useModal";
import { usePagination } from "../hooks/usePagination";
import { useValidation } from "../hooks/useValidation";

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
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string[]>([]);
  const [selectedUserAgent, setSelectedUserAgent] = useState("");
  const { host, port, setHost, setPort, handleAddProxy } = useValidation(
    "",
    "",
    proxies,
    setProxies
  );
  const { showModal, handleShowModal, handleCloseModal } = useModal();
  const proxiesPerPage = 10;
  const {
    currentPage,
    directPageInput,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    handleDirectPageInputChange,
    handleDirectPageSubmit,
  } = usePagination(1, proxiesPerPage, proxies.length);

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

  //TODO: Fix this function to wait for the fucking deactivate proxies function properly before fetch because that's why it isn't working. If I deactivate proxies manually activating a new proxy always works !!!! I can just add an alert that user has to deactivate the active proxy first .... but that's just trivial and I don't wanna do that!
  async function handleActivateProxy(index: number) {
    let { host, port, language, timezone } = proxies[index];
    const [proxyHost, proxyPort] = host.split(":");

    try {
      if (!language || !timezone || timezone === "UTC") {
        const response = await fetch(`https://ipapi.co/${host}/json/`).catch(
          (error) => {
            console.error("Fetch error:", error);
          }
        );

        if (response) {
          const data = await response.json();
          language = data.languages.split(",")[0];
          timezone = data.timezone;
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      language = "en";
      timezone = "UTC";
    }

    getProxyCredentials((credentials) => {
      const { username, password } = credentials;

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

      chrome.runtime.sendMessage(
        {
          type: "activateProxy",
          host: proxyHost,
          port,
          username,
          password,
        },
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
        .filter((line, index) => {
          const key = `line-${index}`;
          return line.trim() !== "";
        })
        .map((line, index) => {
          const key = `line-${index}`;
          const proxy = parseProxyLine(line);
          if (!proxy) {
            console.error(`Error parsing proxy from line: ${line}`);
          }
          return { ...proxy, key };
        })
        .filter(Boolean)
        .map((proxy, index) => ({
          host: `${proxy.ip}`,
          isActive: false,
          ...proxy,
        }));
      setProxies((prevState) => [...prevState, ...newProxies]);
    };
    reader.readAsText(file);
  }

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
      <ProxyInputForm
        host={host}
        port={port}
        userAgent={userAgent}
        selectedUserAgent={selectedUserAgent}
        showModal={showModal}
        setHost={setHost}
        setPort={setPort}
        handleAddProxy={handleAddProxy}
        handleShowModal={handleShowModal}
        handleCloseModal={handleCloseModal}
        handleSelectUserAgent={handleSelectUserAgent}
        handleRemoveUserAgent={handleRemoveUserAgent}
        handleAddProxiesFromFile={handleAddProxiesFromFile}
        handleRemoveAllProxies={handleRemoveAllProxies}
      />

      <div>
        {currentProxies.map((proxy, relativeIndex) => {
          const absoluteIndex =
            (currentPage - 1) * proxiesPerPage + relativeIndex;

          return (
            <ProxiesDisplay
              absoluteIndex={absoluteIndex}
              proxy={proxy}
              handleActivateProxy={handleActivateProxy}
              handleDeactivateProxy={handleDeactivateProxy}
              handleRemoveProxy={handleRemoveProxy}
              handleHeaderActivation={handleHeaderActivation}
            />
          );
        })}
      </div>

      <PaginationControls
        currentPage={currentPage}
        proxiesPerPage={proxiesPerPage}
        proxiesLength={proxies.length}
        directPageInput={directPageInput}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
        handlePageChange={handlePageChange}
        handleDirectPageInputChange={handleDirectPageInputChange}
        handleDirectPageSubmit={handleDirectPageSubmit}
      />
    </div>
  );
}

export default ProxyForm;
