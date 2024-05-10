import { useState } from "react";
import Swal from "sweetalert2";

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
      Swal.fire({
        title: "Input Required",
        text: "Please enter an IP address and port.",
        icon: "info",
        toast: true,
        timer: 3000,
        timerProgressBar: true,
      });

      return;
    }

    if (!isValidIPAddress(host)) {
      Swal.fire({
        title: "Input Required",
        text: "Invalid IP address format. Please enter a valid IP address. Format: 111.222.333.222",
        icon: "info",
        toast: true,
        timer: 3000,
        timerProgressBar: true,
      });

      return;
    }

    const existingProxy = proxies.find((proxy) => proxy.host === host);
    if (existingProxy) {
      Swal.fire({
        title: "Input Required",
        text: "This proxy ip address is already in the list.",
        icon: "info",
        toast: true,
        timer: 3000,
        timerProgressBar: true,
      });

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
