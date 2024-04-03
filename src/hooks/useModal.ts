import { useState, useCallback } from "react";

declare const chrome: any;

export function useModal(
  initialState = false,
  onUpdate = (p0: string[]) => {}
) {
  const [showModal, setShowModal] = useState(initialState);

  const handleShowModal = useCallback(() => {
    chrome.storage.local.get(["proxies"], (result: { proxies: any[] }) => {
      const headersActive = result.proxies.some(
        (proxy) => proxy.headersActive === true
      );

      if (headersActive) {
        alert(
          "You need to deactivate headers before you can change the user agent."
        );
      } else {
        // Fetch the latest user agent list and call the onUpdate callback
        chrome.storage.local.get(
          "userAgent",
          (result: { userAgent: string[] }) => {
            onUpdate(result.userAgent || []);
          }
        );
        setShowModal(true);
      }
    });
  }, [onUpdate]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return { showModal, handleShowModal, handleCloseModal };
}
