import React, { useState, useEffect } from "react";

interface ModalProps {
  showModal: boolean;
  selectedUserAgent: string;
  userAgent: string[];
  handleCloseModal: () => void;
  handleSelectUserAgent: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleRemoveUserAgent: () => void;
}

const generateAlias = (userAgentString: string) => {
  // Extract OS version
  let osMatch = userAgentString.match(
    /Windows NT [\d.]+|Mac OS X [\d._]+|CrOS [\w\s]+/
  );
  let os = osMatch ? osMatch[0].replace(/_/g, ".") : "Unknown OS";

  // Extract Browser name and version
  let browserMatch;
  let browserName, browserVersion;

  // Check for Opera
  browserMatch = userAgentString.match(/OPR\/(\d+(\.\d+)?)/);
  if (browserMatch) {
    browserName = "Opera";
    browserVersion = browserMatch[1];
  }
  // Check for Edge
  else if ((browserMatch = userAgentString.match(/Edge?\/(\d+(\.\d+)?)/))) {
    browserName = "Edge";
    browserVersion = browserMatch[1];
  }
  // Check for Chrome (ensure it's not an Edge/Opera)
  else if (
    !userAgentString.includes("Edge") &&
    !userAgentString.includes("OPR") &&
    (browserMatch = userAgentString.match(/Chrome\/(\d+(\.\d+)?)/))
  ) {
    browserName = "Chrome";
    browserVersion = browserMatch[1];
  }
  // Fallback if none matched
  else {
    browserName = "Unknown Browser";
    browserVersion = "Unknown Version";
  }

  return `${os} ${browserName} ${browserVersion}`;
};

const Modal: React.FC<ModalProps> = ({
  showModal,
  selectedUserAgent,
  userAgent,
  handleCloseModal,
  handleSelectUserAgent,
  handleRemoveUserAgent,
}) => {
  const [webRTCEnabled, setWebRTCEnabled] = useState(true);
  const [iframesEnabled, setIframesEnabled] = useState(true);

  useEffect(() => {
    // Fetch the initial states for WebRTC and iframes from local storage
    chrome.storage.local.get(["webRTC", "iframes"], (result) => {
      // Setup for WebRTC
      if (result.webRTC) {
        setWebRTCEnabled(result.webRTC === "enabled");
      } else {
        // Default to 'enabled' if not set
        chrome.storage.local.set({ webRTC: "enabled" });
        setWebRTCEnabled(true);
      }

      // Setup for iframes
      if (result.iframes) {
        setIframesEnabled(result.iframes === "enabled");
      } else {
        // Default to 'enabled' if not set
        chrome.storage.local.set({ iframes: "enabled" });
        setIframesEnabled(true);
      }
    });
  }, []);

  // Handlers for toggling settings
  const handleWebRTCToggle = () => {
    const newStatus = !webRTCEnabled;
    setWebRTCEnabled(newStatus);
    chrome.storage.local.set(
      { webRTC: newStatus ? "enabled" : "disabled" },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to save WebRTC status:",
            chrome.runtime.lastError.message
          );
        }
      }
    );
  };

  const handleIframesToggle = () => {
    const newStatus = !iframesEnabled;
    setIframesEnabled(newStatus);
    chrome.storage.local.set(
      { iframes: newStatus ? "enabled" : "disabled" },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to save iframes status:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log(
            "Iframes status updated to:",
            newStatus ? "enabled" : "disabled"
          );
        }
      }
    );
  };

  return (
    <>
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div className="fixed inset-0 transition-opacity">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <div
            className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-xl leading-6 text-blue-600">
                    Configure Browser Settings
                  </h3>
                  <div className="mt-2">
                    {/* Select for User Agent */}
                    <label
                      htmlFor="userAgentSelect"
                      className="block text-lg leading-5 text-gray-700 mb-2" // Added mb-2 for margin-bottom
                    >
                      Change User Agent below (optional)
                    </label>
                    <select
                      id="userAgentSelect"
                      value={selectedUserAgent}
                      onChange={handleSelectUserAgent}
                      className="block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" // Additional styling for full-width and focus
                    >
                      <option value="">None</option>
                      {userAgent &&
                        userAgent.map((ua) => (
                          <option key={generateAlias(ua)} value={ua}>
                            {generateAlias(ua)}
                          </option>
                        ))}
                    </select>
                    {/* Checkbox for WebRTC */}
                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={webRTCEnabled}
                          onChange={handleWebRTCToggle}
                          className="form-checkbox rounded text-blue-600 focus:border-blue-600 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                        />
                        <span
                          className={`ml-2 ${
                            webRTCEnabled ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {webRTCEnabled
                            ? "webRTC protection is enabled"
                            : "webRTC protection is disabled"}
                        </span>
                      </label>
                    </div>
                    {/* Checkbox for iframes */}
                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={iframesEnabled}
                          onChange={handleIframesToggle}
                          className="form-checkbox rounded text-blue-600 focus:border-blue-600 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                        />
                        <span
                          className={`ml-2 ${
                            iframesEnabled ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {iframesEnabled
                            ? "iframes protection is enabled"
                            : "iframes protection is disabled"}
                        </span>
                      </label>
                    </div>
                    <div
                      className="modal-content"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Include user agent selection, WebRTC toggle, etc. */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <span className="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
                <button
                  type="button"
                  onClick={handleRemoveUserAgent}
                  className="mb-3 inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-red-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                >
                  Remove User Agent
                </button>
              </span>
              <span className="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-gray-500 text-base leading-6 font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:border-red-700 focus:shadow-outline-red transition ease-in-out duration-150 sm:text-sm sm:leading-5"
                >
                  Close
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modal;
