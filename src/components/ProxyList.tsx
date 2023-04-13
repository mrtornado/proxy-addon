import React, { useState } from "react";
import ProxyItem, { ProxyItemProps } from "./ProxyItem";

interface ProxyListProps {
  proxies: ProxyItemProps["proxy"][];
  handleActivateProxy: (index: number) => void;
  handleDeactivateProxy: (index: number) => void;
  handleRemoveProxy: (index: number) => void;
  handleHeaderActivation: (index: number) => void;
}

const ProxyList: React.FC<ProxyListProps> = ({
  proxies,
  handleActivateProxy,
  handleDeactivateProxy,
  handleRemoveProxy,
  handleHeaderActivation,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProxies = proxies.filter((proxy) =>
    `${proxy.host}:${proxy.port}`.includes(searchTerm)
  );

  return (
    <div>
      <input
        type="text"
        className="search-input"
        placeholder="Search proxies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredProxies.map((proxy, index) => (
        <ProxyItem
          key={index}
          absoluteIndex={index}
          proxy={proxy}
          handleActivateProxy={handleActivateProxy}
          handleDeactivateProxy={handleDeactivateProxy}
          handleRemoveProxy={handleRemoveProxy}
          handleHeaderActivation={handleHeaderActivation}
        />
      ))}
    </div>
  );
};

export default ProxyList;
