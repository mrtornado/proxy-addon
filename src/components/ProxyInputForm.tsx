import React from "react";
import { DefaultButton } from "./Buttons";
import Modal from "./Modal";

interface ProxyInputFormProps {
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

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAddProxiesFromFile(file);
    }
  };

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
    </div>
  );
};

export default ProxyInputForm;
