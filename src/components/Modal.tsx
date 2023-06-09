import React from "react";

interface ModalProps {
  showModal: boolean;
  selectedUserAgent: string;
  userAgent: string[];
  handleCloseModal: () => void;
  handleSelectUserAgent: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  handleRemoveUserAgent: () => void;
}

const generateAlias = (userAgentString: string) => {
  if (userAgentString.includes("Windows NT")) {
    if (userAgentString.includes("OPR")) {
      return "Windows Opera Browser";
    } else if (userAgentString.includes("Edg")) {
      return "Windows Edge";
    } else if (userAgentString.includes("Firefox")) {
      return "Windows Firefox";
    } else if (
      userAgentString.includes("Chrome") &&
      !userAgentString.includes("Edg")
    ) {
      return "Windows Chrome";
    } else if (userAgentString.includes("Xbox One")) {
      return "Xbox One Edge";
    }
  } else if (userAgentString.includes("Macintosh")) {
    if (userAgentString.includes("OPR")) {
      return "Mac OS X Opera";
    } else if (
      userAgentString.includes("Safari") &&
      !userAgentString.includes("Chrome")
    ) {
      return "Mac OS X Safari";
    } else if (userAgentString.includes("Firefox")) {
      return "Mac OS X Firefox";
    } else if (userAgentString.includes("Edg")) {
      return "Mac OS X Edge";
    } else if (userAgentString.includes("Chrome")) {
      return "Mac OS X Chrome";
    }
  }

  return "Unknown Browser";
};

const Modal: React.FC<ModalProps> = ({
  showModal,
  selectedUserAgent,
  userAgent,
  handleCloseModal,
  handleSelectUserAgent,
  handleRemoveUserAgent,
}) => {
  return (
    <>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="fixed inset-0 transition-opacity">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Select a User Agent
                  </h3>
                  <div className="mt-2">
                    <select
                      id="userAgentSelect"
                      value={selectedUserAgent}
                      onChange={handleSelectUserAgent}
                    >
                      <option value="">None</option>
                      {userAgent &&
                        userAgent.map((ua) => (
                          <option key={generateAlias(ua)} value={ua}>
                            {generateAlias(ua)}
                          </option>
                        ))}
                    </select>
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
                  className="inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 bg-red-600 text-base leading-6 font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red transition ease-in-out duration-150 sm:text-sm sm:leading-5"
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
