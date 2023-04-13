import { useState } from "react";

interface Validation {
  host: string;
  port: string;
  setHost: (host: string) => void;
  setPort: (port: string) => void;
  handleAddProxy: () => void;
}

export const useValidation = (
  initialHost: string,
  initialPort: string,
  proxies: any[],
  setProxies: React.Dispatch<React.SetStateAction<any[]>>
): Validation => {
  const [host, setHost] = useState(initialHost);
  const [port, setPort] = useState(initialPort);

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

  return {
    host,
    port,
    setHost,
    setPort,
    handleAddProxy,
  };
};
