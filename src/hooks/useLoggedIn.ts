import { useState, useEffect } from "react";

declare const chrome: any;

const useLoggedIn = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoggedIn = () => {
      if (typeof chrome !== "undefined") {
        chrome.storage.local.get("user", (result: { user: object }) => {
          if (result.user && Object.keys(result.user).length > 0) {
            setLoggedIn(true);
          } else {
            setLoggedIn(false);
          }
        });
      }
    };

    checkLoggedIn();
  }, []);

  return loggedIn;
};

export default useLoggedIn;
