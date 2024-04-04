import { useState, useEffect } from "react";
import ProxyInputForm from "./ProxyInputForm";
import { useModal } from "../hooks/useModal";
import { useValidation } from "../hooks/useValidation";
import Proxy from "../interfaces/proxy";
import ProxyList from "./ProxyList";

declare const chrome: any;

function ProxyForm() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [language, setLanguage] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string[]>([]);
  const [renderKey, setRenderKey] = useState(0);
  const [selectedUserAgent, setSelectedUserAgent] = useState("");
  const { host, port, setHost, setPort, handleAddProxy } = useValidation(
    "",
    "",
    proxies,
    setProxies
  );

  const onModalOpen = (userAgents: string[]) => {
    setUserAgent(userAgents);
  };

  const { showModal, handleShowModal, handleCloseModal } = useModal(
    false,
    onModalOpen
  );

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
    setRenderKey((prevKey) => prevKey + 1);
  }, [proxies]);

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

  function handleHeaderActivation(
    index: number,
    callback: Function = () => {}
  ) {
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

  async function handleActivateProxy(
    index: number,
    callback: Function = () => {}
  ) {
    let { host, port, language, timezone } = proxies[index];

    const getProxyCredentials = (callback: Function) => {
      chrome.storage.sync.get(["username", "password"], (credentials: any) => {
        callback(credentials);
      });
    };

    const sendMessage = (message: any, callback: Function) => {
      chrome.runtime.sendMessage(message, (response: any) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error:",
            chrome.runtime.lastError.message,
            chrome.runtime.lastError
          );
          setTimeout(() => callback(null), 0);
        } else {
          // Check if the response is not null or undefined
          if (response) {
            setTimeout(() => callback(response), 0);
          } else {
            // Handle cases when there is no response
            console.warn(
              "No response received for message type:",
              message.type
            );
            setTimeout(() => callback(null), 0);
          }
        }
      });
    };

    getProxyCredentials((credentials: { username: any; password: any }) => {
      const { username, password } = credentials;

      // Deactivate all proxies
      sendMessage({ type: "deactivateAllProxies" }, () => {
        // Deactivate headers and content script of the previously active proxy
        if (index >= 0) {
          const activeProxy = proxies[index];
          sendMessage(
            {
              type: "deactivateHeaders",
              host: activeProxy.host,
              port: activeProxy.port,
            },
            () => {
              sendMessage({ type: "deactivateContentScript" }, async () => {
                // Activate the new proxy
                try {
                  if (!language || !timezone || timezone === "UTC") {
                    const response = await fetch(
                      `https://ipapi.co/${host}/json/`
                    ).catch((error) => {
                      console.error("Fetch error:", error);
                    });

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
                sendMessage(
                  {
                    type: "activateProxy",
                    host: host,
                    port: port,
                    language: language,
                    timezone: timezone,
                    username: username,
                    password: password,
                  },
                  () => {
                    console.log(
                      `Activated proxy ${host}:${port} with language ${language} and timezone ${timezone}`
                    );
                    setProxies((prevProxies) =>
                      prevProxies.map((proxy, i) => {
                        if (i === index) {
                          return {
                            ...proxy,
                            isActive: true,
                            language,
                            timezone,
                          };
                        } else {
                          return {
                            ...proxy,
                            isActive: false,
                            headersActive: false,
                          };
                        }
                      })
                    );
                  }
                );
              });
            }
          );
          callback();
        }
      });
    });
  }

  function handleDeactivateProxy(index: number, callback: Function) {
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
    callback();
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

          // Update the chrome.storage.local with the newProxies
          chrome.storage.local.set({ proxies: newProxies }, () => {
            console.log("Proxies updated in storage after removal.");
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
      setProxies((prevProxies) => {
        const newProxies = prevProxies.filter((_, i) => i !== index);

        // Update the chrome.storage.local with the newProxies
        chrome.storage.local.set({ proxies: newProxies }, () => {
          console.log("Proxies updated in storage after removal.");
        });

        return newProxies;
      });
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

    // Send message to the background script to activate the content script
    chrome.runtime.sendMessage(
      { type: "activateContentScript", userAgent: selected },
      (response: { success: any }) => {
        if (response.success) {
          console.log("Content script activated");
        } else {
          console.log("Failed to activate content script");
        }
      }
    );
  };

  const handleRemoveUserAgent = () => {
    if (selectedUserAgent) {
      setUserAgent(userAgent.filter((ua) => ua !== selectedUserAgent));
      setSelectedUserAgent("");

      // Send message to the background script to deactivate the content script
      chrome.runtime.sendMessage(
        { type: "deactivateContentScript" },
        (response: { success: any }) => {
          if (response.success) {
            console.log("Content script deactivated");
          } else {
            console.log("Failed to deactivate content script");
          }
        }
      );

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

  // To modify the generateAlias function see below
  // Modal.tsx:12

  useEffect(() => {
    if (typeof chrome !== "undefined") {
      const userAgentList = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.43",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 OPR/96.0.4693.80",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.43",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2866.71 Safari/537.36",
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
        proxies={proxies}
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
        <ProxyList
          proxies={proxies}
          key={renderKey}
          handleActivateProxy={handleActivateProxy}
          handleDeactivateProxy={handleDeactivateProxy}
          handleRemoveProxy={handleRemoveProxy}
          handleHeaderActivation={handleHeaderActivation}
        />
      </div>
    </div>
  );
}

export default ProxyForm;
function callback() {
  throw new Error("Function not implemented.");
}
