import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

declare const chrome: any;

const Trial = () => {
  const [bearerToken, setBearerToken] = useState("");
  const [memberKey, setMemberKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof chrome !== "undefined") {
      chrome.storage.local.get(
        ["user"],
        (result: {
          user: {
            apiKey: React.SetStateAction<string>;
            memberKey: React.SetStateAction<string>;
          };
        }) => {
          if (result.user) {
            if (result.user.apiKey) {
              setBearerToken(result.user.apiKey);
            }
            if (result.user.memberKey) {
              setMemberKey(result.user.memberKey);
            }
          }
        }
      );
    }
  }, []);

  function handleLogout() {
    chrome.storage.local.remove(["user", "proxies"], () => {
      console.log("User and proxies keys removed from storage.");
    });
    navigate("/proxy");
  }

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    const url = `${apiUrl}/api/members/securedApi/trial`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({
        memberKey: memberKey,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(
        "Trial request submited successfully! Give it 2 minutes before your new proxy is active. Also you've been logged out so login again to see your new proxy."
      );
      handleLogout();
      setLoading(false);
      // Handle the response data as needed
    } else {
      console.error(`Error: ${response.status} ${response.statusText}`);
      setLoading(false);
      // Handle the error as needed
    }
  };

  return (
    <div>
      {" "}
      <form method="POST" onSubmit={handleSubmit}>
        <div className="flex justify-center">
          <div className="w-full mt-2 max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
            <h5 className="mb-4 text-xl font-medium text-gray-500 dark:text-gray-400">
              Free 24 hours proxy
            </h5>
            <div className="flex items-baseline text-gray-900 dark:text-white">
              <span className="text-2xl font-semibold">Bonus</span>
              <span className="text-3xl font-extrabold tracking-tight"></span>
              <span className="ml-1 text-xl font-normal text-gray-500 dark:text-gray-400">
                /another 24 hours
              </span>
            </div>
            <ul role="list" className="space-y-5 my-7">
              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  So a total of 48 hours proxy time
                </span>
              </li>
              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  Datacenter Proxy
                </span>
              </li>
              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  HTTP / HTTPS Proxy
                </span>
              </li>

              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  Elite/High anonymous
                </span>
              </li>

              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  Blazing Fast Speeds
                </span>
              </li>

              <li className="flex space-x-3">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 w-5 h-5 text-green-600 dark:text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base font-normal leading-tight text-gray-500 dark:text-gray-400">
                  2 Minutes Activation Time
                </span>
              </li>

              <li className="flex space-x-3 line-through decoration-gray-500">
                <svg
                  aria-hidden="true"
                  className="flex-shrink-0 bg-green w-5 h-5 text-gray-400 dark:text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Check icon</title>
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span className="text-base text-red-500 font-normal leading-tight text-gray-500">
                  Credit card required
                </span>
              </li>
            </ul>
            <button
              type="submit"
              disabled={loading} // Disable button when loading
              className={`text-white ${
                loading ? "bg-blue-500" : "bg-blue-600 hover:bg-blue-700"
              } focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center`}
            >
              {loading ? "Loading..." : "Submit Request"}{" "}
              {/* Change button text based on loading state */}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Trial;
