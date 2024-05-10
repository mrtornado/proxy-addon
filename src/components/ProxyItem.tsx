import React, { useState } from "react";
import {
  MdPowerSettingsNew,
  MdDelete,
  MdSettingsEthernet,
} from "react-icons/md";
import Tooltip from "./Tooltip";

export interface ProxyItemProps {
  absoluteIndex: number;
  originalIndex: number;
  proxy: {
    isActive: boolean;
    headersActive: boolean;
    host: string;
    port: string;
  };
  handleActivateProxy: (index: number, callback: () => void) => void;
  handleDeactivateProxy: (index: number, callback: () => void) => void;
  handleRemoveProxy: (index: number) => void;
  handleHeaderActivation: (index: number) => void;
  setProxyAction: React.Dispatch<React.SetStateAction<string>>; // Add this line
}

const ProxyItem: React.FC<ProxyItemProps> = ({
  absoluteIndex,
  originalIndex,
  proxy,
  handleActivateProxy,
  handleDeactivateProxy,
  handleRemoveProxy,
  handleHeaderActivation,
}) => {
  // Function to handle copying to clipboard
  const [copyFeedback, setCopyFeedback] = useState("");
  const [feedbackPos, setFeedbackPos] = useState({ left: 0, top: 0 });

  const handleCopyToClipboard = async (
    text: string,
    event: React.MouseEvent
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback("Copied to clipboard!");
      setFeedbackPos({ left: event.clientX - 30, top: event.clientY + 20 });
      setTimeout(() => setCopyFeedback(""), 2000); // Message disappears after 2 seconds
    } catch (err) {
      console.error("Failed to copy!", err);
      setCopyFeedback("Failed to copy!");
      setFeedbackPos({ left: event.clientX - 30, top: event.clientY + 20 });
      setTimeout(() => setCopyFeedback(""), 2000); // Message disappears after 2 seconds
    }
  };

  return (
    <div
      key={absoluteIndex}
      className={`${
        proxy.isActive ? "bg-gradient-to-br from-green-400 to-blue-600" : ""
      }`}
    >
      <div key={absoluteIndex} className="flex flex-wrap items-center">
        <div>
          <p className="ml-10 mb-1 mt-1 text-[#fffed8] text-lg">
            <span
              className={`${
                proxy.isActive ? "mr-5 text-[#fffed8]" : "mr-5 text-blue"
              }`}
            >{`IP${absoluteIndex + 1}:`}</span>
            <span
              className="select-all cursor-pointer"
              onClick={(e) =>
                handleCopyToClipboard(`${proxy.host}:${proxy.port}`, e)
              }
            >
              {`${proxy.host}:${proxy.port}`}
            </span>
          </p>
          {copyFeedback && (
            <div
              style={{
                position: "absolute",
                left: feedbackPos.left,
                top: feedbackPos.top,
                backgroundColor: "green",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
            >
              {copyFeedback}
            </div>
          )}
        </div>
        <div className="ml-auto">
          {proxy.isActive ? (
            <Tooltip message="Deactivate Proxy" color="red-500">
              <MdPowerSettingsNew
                onClick={() => handleDeactivateProxy(originalIndex, () => {})}
                className={`cursor-pointer ${
                  proxy.isActive
                    ? "mx-4 text-green-400 text-3xl"
                    : "mx-4 text-3xl"
                }`}
              />
            </Tooltip>
          ) : (
            <Tooltip message="Activate Proxy">
              <MdPowerSettingsNew
                onClick={() => handleActivateProxy(originalIndex, () => {})}
                className="mx-4 cursor-pointer text-3xl"
              />
            </Tooltip>
          )}
        </div>

        <Tooltip message="Remove Proxy" color="red-500">
          <div>
            <MdDelete
              onClick={() => handleRemoveProxy(absoluteIndex)}
              className="mx-4 cursor-pointer text-3xl"
            />
          </div>
        </Tooltip>
        <div>
          {proxy.headersActive ? (
            <Tooltip message="Deactivate Headers Faking" color="red-500">
              <MdSettingsEthernet
                onClick={() => handleHeaderActivation(absoluteIndex)}
                className={`cursor-pointer ${
                  proxy.isActive
                    ? "mx-4 text-green-400 text-3xl"
                    : "mx-4 text-3xl"
                }`}
              />
            </Tooltip>
          ) : (
            <Tooltip message="Activate Headers Faking">
              <MdSettingsEthernet
                onClick={() => handleHeaderActivation(absoluteIndex)}
                className="mx-4 cursor-pointer text-3xl"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyItem;
