import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useActivated } from "../hooks/useLoggedIn";

declare const chrome: any;

const LoginForm = () => {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [trial, setTrial] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [memberKey, setMemberKey] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL;
  const activated = useActivated();

  const handleSignup = () => {
    navigate("/signup");
  };

  const handleTrial = () => {
    navigate("/trial");
  };

  const handleSuccessfulLogin = async (apiKey: string, memberKey: string) => {
    setReloading(true);
    await fetchProxies(apiKey, memberKey);
    await new Promise((resolve) => {
      chrome.storage.local.get("proxies", (data: { proxies: any[] }) => {
        if (data.proxies && data.proxies.length > 0) {
          resolve(true);
          navigate("/proxy");
        } else {
          resolve(true);
          alert(
            "You have NO PROXIES, sign up for a trial if you didn't already. If you did just get some proxies"
          );
          navigate("/proxy");
        }
      });
    });
    setReloading(false);
  };

  const fetchProxies = useCallback(
    async (apiKey: any, memberKey: any) => {
      return new Promise(async (resolve) => {
        const abortController = new AbortController();
        const { signal } = abortController;

        const proxies = await fetch(
          `${apiUrl}/api/members/securedApi/proxies`,
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

          const insertProxies = proxiesData.proxies;
          if (typeof chrome !== "undefined") {
            chrome.storage.local.get(
              "proxies",
              (data: { proxies: never[] }) => {
                let existingProxies = data.proxies || [];

                // Merge existing and new proxies
                let mergedProxies = existingProxies.concat(insertProxies);

                // Remove duplicates based on the host property
                let uniqueProxies = mergedProxies.filter(
                  (proxy: any, index: number, self: any[]) =>
                    index ===
                    self.findIndex(
                      (otherProxy: any) => otherProxy.host === proxy.host
                    )
                );

                if (uniqueProxies.length > 0) {
                  chrome.storage.local.set({ proxies: uniqueProxies }, () => {
                    alert("Proxies have been inserted!");
                    resolve(true);
                  });
                } else {
                  alert(
                    "No proxies were inserted! because you don't have any proxies with us, or all your proxies are socks5"
                  );
                  navigate("/proxies");
                }
              }
            );
          }
        } else {
          resolve(false);
        }
      });
    },
    [navigate]
  );

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (typeof chrome !== "undefined") {
        const user = await new Promise<{
          user: {
            apiKey: any;
            memberKey: any;
            username: string;
            trial: boolean;
          };
        }>((resolve) => {
          chrome.storage.local.get(
            "user",
            (data: {
              user: {
                apiKey: any;
                memberKey: any;
                username: string;
                trial: boolean;
              };
            }) => {
              resolve(data);
            }
          );
        });

        if (user.user && user.user.apiKey && user.user.memberKey) {
          setUsername(user.user.username);
          setApiKey(user.user.apiKey);
          setMemberKey(user.user.memberKey);
          setTrial(user.user.trial);
          setLoading(false);
          // Comment out the next line to stop automatically fetching proxies
          // handleSuccessfulLogin(user.user.apiKey, user.user.memberKey);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
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
      const response = await fetch(`${apiUrl}/api/members/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (typeof chrome !== "undefined") {
        if (data.trial) {
          setTrial(true);
        }
        chrome.storage.local.set({ user: data });
      }

      if (!data.error) {
        const apiKey = data.apiKey;
        // Handle successful login
        handleSuccessfulLogin(data.apiKey, data.memberKey);
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
        activated === false ? (
          <div className="flex flex-col justify-center">
            <div className="pt-16 text-center text-3xl text-red-600">
              <p className="text-center">
                Your account has not been{" "}
                <span className="text-green-500">activated</span> yet.
              </p>
              <p className="text-center">
                If you haven't received the activation email, be sure to check
                your junk or spam folder.
              </p>
              <p className="text-yellow-500">
                If your account has been activated already, you still need to
                log out and then log back in to update the activation status.{" "}
              </p>
            </div>
            <div className="flex justify-center">
              <button
                className="text-2xl mt-4 px-4 py-2 rounded hover:bg-white hover:text-black bg-transparent text-white border-2 border-white"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className=" pt-2 text-center text-4xl text-[#fffed8] mb-2">
            <p>Welcome, {username}!</p>
            <div className="flex justify-center">
              {loading ? (
                <div className="text-center text-2xl text-white">
                  Loading...
                </div>
              ) : (
                !trial && (
                  <div className="border-white rounded-4 ">
                    <a
                      onClick={handleTrial}
                      className="text-2xl mt-4 px-4 py-2 rounded hover:bg-white hover:text-black bg-transparent text-white border-2 border-white"
                    >
                      Apply For a Free Proxy Trial
                    </a>
                  </div>
                )
              )}

              <div className=" border-white rounded-4 ">
                <a
                  className="ml-8 text-2xl mt-4 px-4 py-2 rounded hover:bg-white hover:text-black bg-transparent text-white border-2 border-white"
                  href="https://www.yourprivateproxy.com/buy-private-proxies"
                  target="_blank"
                >
                  Get More Proxies
                </a>
              </div>
            </div>

            <p className="text-sm text-red-500">
              Warning! The extension won't import socks5 proxies because the
              browser doesn't support socks5 authentification, so please login
              to{" "}
              <a
                className="no-underline text-blue-500 on-hover:text-green-500"
                href="https://www.yourprivateproxy.com/my-account/login"
                target="_blank"
              >
                YourPrivateProxy website
              </a>{" "}
              and change your proxies to http protocol on the desired config.
            </p>
            <button
              className="text-2xl mt-4 px-4 py-2 rounded hover:bg-white hover:text-black bg-transparent text-white border-2 border-white"
              onClick={() => handleSuccessfulLogin(apiKey, memberKey)}
              disabled={reloading}
            >
              {reloading ? "Loading..." : "Reload Proxy List"}
            </button>
            <div className="mt-2">
              <div>
                <button
                  className="text-2xl mt-4 px-4 py-2 rounded hover:bg-white hover:text-black bg-transparent text-white border-2 border-white"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
              <div className="mt-8 ">
                <Link className="text-3xl text-white" to="/proxy">
                  {" "}
                  Go back to Proxies Page{" "}
                </Link>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="flex justify-center">
          <div className="w-xl">
            <div className="text-xl ml-4 mr-4 mt-10 mb-10">
              <a onClick={handleSignup} className="text-center text-green-500">
                <span className="cursor-pointer text-2xl underline text-green-500">
                  Create an account
                </span>
              </a>{" "}
              with YourPrivateProxy if you don't have one, and{" "}
              <span className="text-yellow-500">
                you will be able to import multiple proxies from file.
              </span>{" "}
              <br />
              <span className="text-blue-500">
                It's free!{" "}
                <span className="text-red-500">No credit card required.</span>
              </span>{" "}
              <br />
              Once you do that you will be able to apply for a free trial proxy.
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
                  Login
                </button>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleSignup}
                  className=" rounded-full text-2xl w-md hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
                >
                  Create Account
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
