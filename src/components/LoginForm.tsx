import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTransition, animated } from "react-spring";
import { useNavigate, Link } from "react-router-dom";

interface StepProps {
  title: string;
  children: React.ReactNode;
  visible: boolean;
}

declare const chrome: any;

const Step = ({ title, children, visible }: StepProps) => (
  <div className={`step ${visible ? "" : "hidden"}`}>
    <h2 className="text-2xl pb-20 font-bold mb-4 text-center text-white">
      {title}
    </h2>
    {children}
  </div>
);

const LoginForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
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
    handleSubmit();
  };

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
      console.log("Response status:", response.status);
      console.log("Response data:", data);
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

  const transitions = useTransition(currentStep, {
    from: { opacity: 0, transform: "translateY(100%)" },
    enter: { opacity: 1, transform: "translateY(0%)" },
    leave: { opacity: 0, transform: "translateY(-100%)" },
    config: { duration: 1000 },
  });

  const handleNext = () => {
    console.log("trying to login");

    if (currentStep === 0 && email.length >= 1) {
      switch (true) {
        case email.length < 3:
          setError("minimum of 3 characters");
          return null;
        case email.length > 40:
          setError("maximum 40 characters");
          return null;
      }
    } else if (currentStep === 1) {
      switch (true) {
        case password.length < 6:
          setError("minimum of 6 characters");
          return null;
        case password.length > 40:
          setError("maximum 40 characters");
          return null;
      }
    } else if (currentStep === 2) {
      handleSubmit();
      return;
    }
    setError("");

    setCurrentStep((prevStep) => {
      console.log("currentStep inside handleNext:", prevStep);
      return prevStep + 1;
    });
  };

  const handlePrevious = () => {
    setError("");
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleonKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (currentStep === 0 && email.length >= 1) {
        handleNext();
      } else if (currentStep === 1 && password.length >= 1) {
        handleNext();
      } else if (currentStep === 2) {
        handleNext();
      }
    }
  };

  useEffect(() => {
    if (currentStep === 1 && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [currentStep]);

  return (
    <div className="absolute overflow-hidden top-0 h-full w-full items-center bg-gradient-to-br from-gray-700 via-gray-900 to-black">
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
            <Link className="text-white" to="/proxy">
              {" "}
              Go back to Proxies Page{" "}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex h-screen justify-center">
          <div id="step-bar" className="top-0 fixed w-full">
            <div className="flex w-full">
              <div
                className={`flex-1 h-2 rounded-full ${
                  currentStep >= 0 ? "bg-[#fffed8]" : "bg-gray-400"
                }`}
              ></div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  currentStep >= 1 ? "bg-[#fffed8]" : "bg-gray-400"
                }`}
              ></div>
              <div
                className={`flex-1 h-2 rounded-full ${
                  currentStep >= 2 ? "bg-[#fffed8]" : "bg-gray-400"
                }`}
              ></div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center">
            {transitions((props, item) => (
              <animated.div style={props} key={item} className="absolute">
                {item === 0 && (
                  <Step title="Step 1: Email or Username" visible={true}>
                    <div className="mb-20">
                      <a
                        href="https://www.yourprivateproxy.com/my-account/register"
                        target="blank"
                        className="text-center text-lg text-white"
                      >
                        Create an account
                      </a>
                      with YourPrivateProxy if you don't have one. It's free!
                      This way you will be able to apply for a free trial proxy
                      an
                    </div>
                    {error && (
                      <p className="text-2xl text-red-600 text-center">
                        {error}
                      </p>
                    )}
                    <input
                      className="text-4xl font-extrabold text-[#fffed8] px-4 py-2 border-b border-white text-white bg-transparent focus:outline-none"
                      type="email"
                      autoFocus
                      value={email}
                      placeholder="Email / Username"
                      onChange={(e) =>
                        setEmail(
                          (e.target as unknown as HTMLSelectElement)?.value
                        )
                      }
                      onKeyUp={handleonKeyUp}
                    />
                    <p className="mt-4 text-white text-center">
                      You can use the Enter key to continue
                    </p>

                    <button
                      className="flex mx-auto mt-20 hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 mt-4 rounded"
                      onClick={handleNext}
                    >
                      Continue
                    </button>
                  </Step>
                )}
                {item === 1 && (
                  <Step title="Step 2: Password" visible={true}>
                    {error && (
                      <p className="text-2xl text-red-600 text-center">
                        {error}
                      </p>
                    )}
                    <input
                      className="text-4xl font-extrabold w-full px-4 py-2 border-b border-white text-[#fffed8] bg-transparent focus:outline-none"
                      onChange={(e) =>
                        setPassword(
                          (e.target as unknown as HTMLSelectElement)?.value
                        )
                      }
                      type="password"
                      ref={passwordInputRef}
                      value={password}
                      placeholder="Password"
                      onKeyUp={handleonKeyUp}
                    />
                    <p className="text-white text-center">
                      You can use the Enter key to continue
                    </p>
                    <div className="flex justify-between mt-20">
                      <button
                        className=" hover:bg-white hover:text-black bg-transparent text-white border-2 border-white mx-4 px-4 py-2 rounded"
                        onClick={handlePrevious}
                      >
                        Previous
                      </button>
                      <button
                        className="hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
                        onClick={handleNext}
                      >
                        Continue
                      </button>
                    </div>
                  </Step>
                )}
                {item === 2 && (
                  <Step title="Step 3: Confirm" visible={true}>
                    {/* Display the entered information and a confirm button */}
                    <p className="text-2xl text-[#fffed8] text-center">
                      Email or Username: {email}
                    </p>
                    <p className="text-2xl text-[#fffed8] text-center">
                      Password: hidden
                    </p>
                    <p className="text-center text-white">
                      Review your information and click Submit.
                    </p>
                    <div className="flex justify-between mt-12 bottom-4 right-4">
                      <button
                        className="hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
                        onClick={handlePrevious}
                      >
                        Previous
                      </button>
                      <button
                        className="hover:bg-white hover:text-black bg-transparent text-white border-2 border-white px-4 py-2 rounded"
                        onClick={handleFormSubmit}
                      >
                        Submit
                      </button>
                    </div>
                  </Step>
                )}
              </animated.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
