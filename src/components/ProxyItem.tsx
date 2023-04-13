import React, { useState } from "react";
import {
  MdPowerSettingsNew,
  MdDelete,
  MdSettingsEthernet,
} from "react-icons/md";
import Tooltip from "./Tooltip";

export interface ProxyItemProps {
  absoluteIndex: number;
  proxy: {
    isActive: boolean;
    headersActive: boolean;
    host: string;
    port: string;
  };
  handleActivateProxy: (index: number) => void;
  handleDeactivateProxy: (index: number) => void;
  handleRemoveProxy: (index: number) => void;
  handleHeaderActivation: (index: number) => void;
}

const ProxyItem: React.FC<ProxyItemProps> = ({
  absoluteIndex,
  proxy,
  handleActivateProxy,
  handleDeactivateProxy,
  handleRemoveProxy,
  handleHeaderActivation,
}) => (
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
          {`${proxy.host}:${proxy.port}`}
        </p>
      </div>
      <div className="ml-auto">
        {proxy.isActive ? (
          <Tooltip message="Deactivate Proxy">
            <MdPowerSettingsNew
              onClick={() => handleDeactivateProxy(absoluteIndex)}
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
              onClick={() => handleActivateProxy(absoluteIndex)}
              className="mx-4 cursor-pointer text-3xl"
            />
          </Tooltip>
        )}
      </div>

      <Tooltip message="Remove Proxy from Proxies List">
        <div>
          <MdDelete
            onClick={() => handleRemoveProxy(absoluteIndex)}
            className="mx-4 cursor-pointer text-3xl"
          />
        </div>
      </Tooltip>
      <div>
        {proxy.headersActive ? (
          <Tooltip message="Deactivate Headers Faking">
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

export default ProxyItem;
