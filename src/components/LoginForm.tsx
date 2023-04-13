import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";

declare const chrome: any;

const LoginForm = () => {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [memberKey, setMemberKey] = useState("");

  const handleSuccessfulLogin = async (apiKey: string, memberKey: string) => {
    console.log("Calling fetchProxies function");
    await fetchProxies(apiKey, memberKey);
    navigate("/proxy");
  };

  const fetchProxies = useCallback(
    async (apiKey: any, memberKey: any) => {
      console.log(
        "fetchProxies called with apiKey and memberKey:",
        apiKey,
        memberKey
      ); // Add a log here

      const abortController = new AbortController();
      const { signal } = abortController;

      const proxies = await fetch(
        "http://localhost:8000/api/members/securedApi/proxies",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberKey: memberKey,
          }),
          signal,
        }
      );

      if (proxies.ok) {
        const proxiesData = await proxies.json();
        console.log("Proxies data fetched:", proxiesData); // Add a log here

        const insertProxies = proxiesData.proxies;
        if (typeof chrome !== "undefined") {
          // Get the existing proxies array from the storage
          chrome.storage.local.get("proxies", (data: { proxies: never[] }) => {
            console.log("Existing proxies:", data.proxies); // Add a log here

            let existingProxies = data.proxies || [];

            // Filter out duplicate proxies
            let uniqueProxies = insertProxies.filter((newProxy: any) => {
              return !existingProxies.some(
                (existingProxy: any) =>
                  JSON.stringify(newProxy) === JSON.stringify(existingProxy)
              );
            });

            // Concatenate the new unique proxies with the existing ones
            let updatedProxies = existingProxies.concat(uniqueProxies);

            // Set the updated array back into the storage
            chrome.storage.local.set({ proxies: updatedProxies }, () => {
              // Alert the message after successfully inserting the proxies
            });
            alert("Proxies have been inserted!");
          });
        }
      } else {
        console.log("Proxies fetch failed with status:", proxies.status); // Add a log here
      }
    },
    [navigate]
  );

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (typeof chrome !== "undefined") {
        const user = await new Promise<{
          user: { apiKey: any; memberKey: any; username: string };
        }>((resolve) => {
          chrome.storage.local.get(
            "user",
            (data: {
              user: { apiKey: any; memberKey: any; username: string };
            }) => {
              resolve(data);
            }
          );
        });

        if (user.user && user.user.apiKey && user.user.memberKey) {
          setUsername(user.user.username);
          setApiKey(user.user.apiKey);
          setMemberKey(user.user.memberKey);
          // Comment out the next line to stop automatically fetching proxies
          // handleSuccessfulLogin(user.user.apiKey, user.user.memberKey);
        }
      }
    };

    checkLoginStatus();
  }, [fetchProxies]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.length > -1 || password.length > -1) {
      switch (true) {
        case email.length < 3:
          setError("Email / User must have minimum of 3 characters");
          return null;
        case email.length > 40:
          setError("Email / User must be maximum 40 characters");
          return null;
        case password.length < 6:
          setError("Password must have minimum 6 characters");
          return null;
        case password.length > 40:
          setError("Password must have maximum 40 characters");
          return null;
        default:
          handleSubmit();
      }
    }
    setError("");
  };

  function handleLogout() {
    chrome.storage.local.remove(["user", "proxies"], () => {
      console.log("User and proxies keys removed from storage.");
    });
    navigate("/proxy");
  }

  const handleSubmit = async () => {
    try {
      console.log("trying to login");
      const response = await fetch(
        "http://localhost:8000/api/members/sign-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();
      if (typeof chrome !== "undefined") {
        chrome.storage.local.set({ user: data });
      }

      if (response.ok) {
        const apiKey = data.apiKey;
        // Handle successful login
        handleSuccessfulLogin(data.apiKey, data.memberKey);
        console.log("Login successful:", data);
      } else {
        // Handle unsuccessful login
        setError(data.error);
      }
    } catch (error) {
      // Handle network errors
      console.error("Error:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="h-screen items-center bg-gradient-to-br from-gray-700 via-gray-900 to-black">
      {username ? (
        <div className="text-center text-[#fffed8] mb-4">
          <p>Welcome, {username}!</p>
          <button
            className="hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
            onClick={() => handleSuccessfulLogin(apiKey, memberKey)}
          >
            Reload Proxy List
          </button>
          <div className="mt-2">
            <div>
              <button
                className="hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
            <Link className="text-white" to="/proxy">
              {" "}
              Go back to Proxies Page{" "}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-xl">
            <div className="text-xl ml-4 mr-4 mt-10 mb-10">
              <a
                href="https://www.yourprivateproxy.com/my-account/register"
                target="blank"
                className="text-center text-lg text-white"
              >
                <span className="text-[#fffed8]">Create an account</span>
              </a>{" "}
              with YourPrivateProxy if you don't have one. <br />
              <span className="text-green">
                It's free! No credit card required.
              </span>{" "}
              <br />
              Once you do that you will be able to apply for a free trial proxy
              and use this app to the full of it's capibilities.
            </div>
            {error && (
              <p className="text-2xl text-red-600 text-center">{error}</p>
            )}
            <form onSubmit={handleFormSubmit}>
              <div className="flex justify-center">
                <input
                  className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8]  bg-transparent focus:outline-none"
                  type="text"
                  autoFocus
                  value={email}
                  placeholder="Email or Username"
                  onChange={(e) =>
                    setEmail((e.target as unknown as HTMLSelectElement)?.value)
                  }
                />
              </div>
              <div className="flex justify-center">
                <input
                  className="m-2 text-4xl font-extrabold px-4 py-2 border-b rounded-full text-[#fffed8] bg-transparent focus:outline-none"
                  onChange={(e) =>
                    setPassword(
                      (e.target as unknown as HTMLSelectElement)?.value
                    )
                  }
                  type="password"
                  ref={passwordInputRef}
                  value={password}
                  placeholder="Password"
                />
              </div>
              <div className="mt-4 flex justify-center">
                <button className=" rounded-full text-2xl w-md hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
