import React, { useState, useEffect } from "react";
import ProxyItem, { ProxyItemProps } from "./ProxyItem";
import PaginationControls from "./PaginationControls";
import { usePagination } from "../hooks/usePagination";

interface ProxyListProps {
  proxies: ProxyItemProps["proxy"][];
  handleActivateProxy: (index: number, callback: () => void) => void;
  handleDeactivateProxy: (index: number, callback: () => void) => void;
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
  const [proxyAction, setProxyAction] = useState("");
  const [operationInProgress, setOperationInProgress] = useState(false);
  const proxiesPerPage = 10;
  const filteredProxies = proxies.filter((proxy) =>
    `${proxy.host}:${proxy.port}`.includes(searchTerm)
  );
  const {
    currentPage,
    directPageInput,
    resetCurrentPage,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    handleDirectPageInputChange,
    handleDirectPageSubmit,
  } = usePagination(1, proxiesPerPage, () => filteredProxies.length);

  useEffect(() => {
    if (proxyAction !== "activate" && proxyAction !== "deactivate") {
      resetCurrentPage();
    }
  }, [searchTerm, proxyAction]);

  useEffect(() => {
    if (proxies.length === 0) {
      resetCurrentPage();
    }
    resetToActiveProxyPage();
  }, [proxies]);

  const resetToActiveProxyPage = () => {
    const activeProxyIndex = filteredProxies.findIndex(
      (proxy) => proxy.isActive
    );
    if (activeProxyIndex !== -1) {
      const activeProxyPage = Math.ceil(
        (activeProxyIndex + 1) / proxiesPerPage
      );
      handlePageChange(activeProxyPage);
    }
  };

  const indexOfLastProxy = currentPage * proxiesPerPage;
  const indexOfFirstProxy = indexOfLastProxy - proxiesPerPage;
  const currentProxies = filteredProxies.slice(
    indexOfFirstProxy,
    indexOfLastProxy
  );

  return (
    <div className="flex flex-col justify-center">
      {proxies.length > 10 && (
        <div className="flex justify-center">
          <input
            type="text"
            className="search-input max-w-md mt-2 mb-2 w-40 p-2 text-white bg-yellow-5 border rounded-lg placeholder-black"
            placeholder="Search for proxies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {currentProxies.map((proxy, index) => (
        <ProxyItem
          key={index}
          absoluteIndex={indexOfFirstProxy + index}
          originalIndex={proxies.indexOf(proxy)}
          proxy={proxy}
          handleActivateProxy={(index, onSuccess) => {
            setOperationInProgress(true);
            handleActivateProxy(index, () => {
              setSearchTerm(searchTerm);
              onSuccess && onSuccess();
              setOperationInProgress(false);
            });
          }}
          handleDeactivateProxy={(index, onSuccess) => {
            setOperationInProgress(true);
            handleDeactivateProxy(index, () => {
              setSearchTerm(searchTerm);
              onSuccess && onSuccess();
              setOperationInProgress(false);
            });
          }}
          handleRemoveProxy={handleRemoveProxy}
          handleHeaderActivation={handleHeaderActivation}
          setProxyAction={setProxyAction} // Add this line
        />
      ))}
      <PaginationControls
        filteredProxiesLength={filteredProxies.length}
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
};

export default ProxyList;
