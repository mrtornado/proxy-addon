import React from "react";
import { DefaultButton } from "./Buttons";
import Modal from "./Modal";
import Proxy from "../interfaces/proxy";
import Tooltip from "./Tooltip";
import useLoggedIn from "../hooks/useLoggedIn";
import { Link } from "react-router-dom";

interface ProxyInputFormProps {
  proxies: Proxy[];
  host: string;
  port: string;
  userAgent: string[];
  selectedUserAgent: string;
  showModal: boolean;
  setHost: (value: string) => void;
  setPort: (value: string) => void;
  handleAddProxy: () => void;
  handleShowModal: () => void;
  handleCloseModal: () => void;
  handleSelectUserAgent: (event: any) => void;
  handleRemoveUserAgent: () => void;
  handleAddProxiesFromFile: (file: File) => void;
  handleRemoveAllProxies: () => void;
}

const ProxyInputForm: React.FC<ProxyInputFormProps> = ({
  proxies,
  host,
  port,
  userAgent,
  selectedUserAgent,
  showModal,
  setHost,
  setPort,
  handleAddProxy,
  handleShowModal,
  handleCloseModal,
  handleSelectUserAgent,
  handleRemoveUserAgent,
  handleAddProxiesFromFile,
  handleRemoveAllProxies,
}) => {
  const inputFileRef = React.useRef<HTMLInputElement>(null);
  const loggedIn = useLoggedIn();
  console.log(loggedIn);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAddProxiesFromFile(file);
    }
  };

  const data = proxies.map((proxy) => {
    return { key: proxy.host, value: proxy.host };
  });

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
        <Tooltip message="Only HTTP or HTTPS proxy">
          <DefaultButton onClick={handleAddProxy}>Add Proxy</DefaultButton>
        </Tooltip>
        <div>
          {" "}
          <DefaultButton
            className="text-red-500 hover:bg-red-500 hover:text-white dark:text-white"
            onClick={handleRemoveAllProxies}
          >
            Remove All Proxies
          </DefaultButton>
        </div>
      </div>
      <div className="flex">
        <div>
          <Tooltip message="Change UserAgent, Enable/Disable webRTC & iframes">
            <DefaultButton onClick={handleShowModal}>
              Configure Browser Settings
            </DefaultButton>
          </Tooltip>
          {loggedIn ? (
            ""
          ) : (
            <a
              target="_blank"
              href="https://www.yourprivateproxy.com/my-account/register"
            >
              <span className="cursor-pointer ml-2 text-2xl underline text-green-500">
                Create YPP account and load multiple proxies.
              </span>
            </a>
          )}

          <Modal
            showModal={showModal}
            selectedUserAgent={selectedUserAgent}
            userAgent={userAgent}
            handleCloseModal={handleCloseModal}
            handleSelectUserAgent={handleSelectUserAgent}
            handleRemoveUserAgent={handleRemoveUserAgent}
          />
        </div>

        {loggedIn && (
          <div>
            <Tooltip message="Import Proxies format IP:PORT or IP:PORT:USERNAME:PASSWORD">
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
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProxyInputForm;
