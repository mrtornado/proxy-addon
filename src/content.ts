//@ts-nocheck
export {};

// content.ts

// Function to remove iframes from the given element
function removeIframes(element: Element) {
  element.querySelectorAll("iframe").forEach((iframe) => {
    iframe.remove();
  });
}

// Function to conditionally remove iframes based on local storage setting
function conditionallyRemoveIframes(element = document) {
  chrome.storage.local.get("iframes", (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Failed to retrieve settings:",
        chrome.runtime.lastError.message
      );
      return;
    }

    if (result.iframes === "disabled") {
      console.log("Iframe removal is explicitly disabled via settings.");
    } else {
      // Default action is to remove iframes unless disabled
      removeIframes(element);
    }
  });
}

// Function to observe DOM mutations and apply iframe removal logic
function observeMutations() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          conditionallyRemoveIframes(node); // Apply conditional iframe removal
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Clean up observer on page unload to avoid memory leaks or invalid context issues
  window.addEventListener("unload", () => observer.disconnect());
}

// Main function that encapsulates the core logic of the script
function main() {
  observeMutations(); // Start observing the DOM for changes
  conditionallyRemoveIframes(); // Initial check and removal on the whole document
}

// Check if the extension's runtime context is still valid before executing the main logic
if (chrome.runtime.id !== undefined) {
  main();
} else {
  console.log("Extension context is invalidated. Halting script execution.");
}

function useProperties(properties) {
  // Find the proxy with isActive set to true
  const activeProxy = properties.proxies.find((proxy) => proxy.isActive);

  if (activeProxy) {
    const { language, timezone } = activeProxy;
    const UserAgent = properties.ua || window.navigator.userAgent;
    let os;

    if (UserAgent.indexOf("Windows") !== -1) {
      os = "Windows";
    } else if (UserAgent.indexOf("Mac") !== -1) {
      os = "MacIntel";
    }

    // Call the setupUserAgentHook function with the retrieved values
    setupUserAgentHook(UserAgent, language, timezone, os);
    // Send a message to the background script to set the timezone
  } else {
    console.warn("No active proxy found");
  }
}

// Accessing all properties from chrome.storage.local
chrome.storage.local.get(null, (result) => {
  // Call the function with the properties
  useProperties(result);
});

function setupUserAgentHook(UserAgent, language, timezone, os) {
  // if (typeof UserAgent !== "string" && UserAgent == "") return false;
  if (UserAgent === "") return false;

  function addslashes(str) {
    // Quote string with slashes
    return str.replace(/([\"\'])/g, "\\$1");
  }
  var actualCode =
    "(" +
    function (newUserAgent, language, timezone, os) {
      "use strict";

      const OriginalDateTimeFormat = Intl.DateTimeFormat;

      Intl.DateTimeFormat = function (locale, options) {
        options = options || {};
        options.timeZone = timezone;
        return new OriginalDateTimeFormat(locale, options);
      };

      // Copy the properties from the original object to the new object
      Object.getOwnPropertyNames(OriginalDateTimeFormat).forEach((prop) => {
        Intl.DateTimeFormat[prop] = OriginalDateTimeFormat[prop];
      });

      // Override the resolvedOptions function
      const originalResolvedOptions =
        OriginalDateTimeFormat.prototype.resolvedOptions;
      OriginalDateTimeFormat.prototype.resolvedOptions = function () {
        const options = originalResolvedOptions.call(this);
        options.timeZone = timezone;
        return options;
      };

      // New override for Date.prototype.toLocaleString
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function (locale, options) {
        options = options || {};
        options.timeZone = timezone; // Set the desired timezone
        return originalToLocaleString.call(this, locale, options);
      };

      // Override for Date.prototype.toString
      Date.prototype.toString = function () {
        return new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          weekday: "long", // e.g., Wednesday
          year: "numeric", // e.g., 2024
          month: "long", // e.g., April
          day: "numeric", // e.g., 3
          hour: "numeric", // e.g., 11
          minute: "2-digit", // e.g., 29
          second: "2-digit", // e.g., 05
          hour12: true, // Use 12-hour format
          timeZoneName: "long", // e.g., British Summer Time
        }).format(this);
      };

      var navigator = Object.create(window.navigator);
      function rTMPL(o) {
        return {
          value: o,
          configurable: false,
          enumerable: true,
          writable: false,
        };
      }
      var ChromeOnly = newUserAgent.replace(/^.*Chrome\/(\d+).*$/gi, "$1");
      var ChromeFullVersion = newUserAgent.match(/Chrome\/([\d.]+)/)?.[1];
      var appVer = newUserAgent.replace(/^Mozilla\//, "");
      var ChromeV =
        newUserAgent.match(/Edg\/(\d+)/)?.[1] ||
        newUserAgent.match(/OPR\/(\d+)/)?.[1] ||
        newUserAgent.replace(/^.*Chrome\/(\d+).*$/gi, "$1");
      // full version lookup
      var ChromeVFull;

      var edgeMatch = newUserAgent.match(/Edg\/([\d.]+)/);
      var operaMatch = newUserAgent.match(/OPR\/([\d.]+)/);
      var chromeMatch = newUserAgent.match(/Chrome\/([\d.]+)/);

      if (edgeMatch) {
        ChromeVFull = edgeMatch[1];
      } else if (operaMatch) {
        ChromeVFull = operaMatch[1];
      } else if (chromeMatch) {
        ChromeVFull = chromeMatch[1];
      } else {
        ChromeVFull = "Unknown Version";
      }
      // end full version lookup

      var osVersion = newUserAgent
        .match(/Windows NT (\d+\.\d+)|Mac OS X (\d+(_\d+)+)/)
        ?.slice(1)
        .find(Boolean)
        ?.replace(/_/g, ".");

      const browserName =
        newUserAgent
          .match(/(Firefox|OPR|Edg)\//)?.[1]
          .replace("OPR", "Opera")
          .replace("Edg", "Edge") ||
        (newUserAgent.includes("Safari/") &&
        !newUserAgent.includes("Chrome/") &&
        !newUserAgent.includes("Edg/")
          ? "Safari"
          : "Chrome");

      Object.defineProperties(navigator, {
        userAgent: rTMPL(newUserAgent),
        appVersion: rTMPL(appVer),
        platform: rTMPL(os),
        productSub: rTMPL("20030107"),
        language: rTMPL(language),
        languages: rTMPL(language),
        userAgentData: rTMPL({
          brands: [
            { brand: browserName, version: ChromeV },
            { brand: " Not A;Brand", version: "8" },
            { brand: "Chromium", version: ChromeOnly },
          ],
          mobile: false,
          platform: os,
          platformVersion: osVersion,
          architecture: "x86",
          uaFullVersion: ChromeFullVersion,
          fullVersionList: [
            { brand: browserName, version: ChromeVFull },
            { brand: "Not:A-Brand", version: "8.0.0.0" },
            { brand: "Chromium", version: ChromeFullVersion },
          ],
        }),

        deviceMemory: rTMPL(8),
        hardwareConcurrency: rTMPL(8),

        maxTouchPoints: rTMPL(0),
        msMaxTouchPoints: rTMPL(0),
        vendor: rTMPL("Google Inc."),
        appCodeName: rTMPL("Mozilla"),
        appName: rTMPL("Netscape"),
        product: rTMPL("Gecko"),
        bluetooth: rTMPL({}),
        clipboard: rTMPL({}),
        credentials: rTMPL({}),
        ink: rTMPL({}),
        keyboard: rTMPL({}),
        locks: rTMPL({}),
        mediaCapabilities: rTMPL({}),
        permissions: rTMPL({}),
        plugins: rTMPL({}),
        scheduling: rTMPL({}),
        storage: rTMPL({}),
        wakeLock: rTMPL({}),
        webkitPersistentStorage: rTMPL({}),
        webkitTemporaryStorage: rTMPL({}),
        windowControlsOverlay: rTMPL({}),
        onLine: rTMPL(true),
        pdfViewerEnabled: rTMPL(true),
        cookieEnabled: rTMPL(true),
        webdriver: rTMPL(false),
        doNotTrack: rTMPL(null),
        vendorSub: rTMPL(""),
        xr: rTMPL("XRSy"),

        mediaDevices: rTMPL({ ondevicechange: null }),
        usb: rTMPL({ onconnect: null, ondisconnect: null }),
        hid: rTMPL({ onconnect: null, ondisconnect: null }),
        managed: rTMPL({ onmanagedconfigurationchange: null }),
        serial: rTMPL({ onconnect: null, ondisconnect: null }),
        presentation: rTMPL({ defaultRequest: null, receiver: null }),
        mediaSession: rTMPL({ metadata: null, playbackState: "none" }),
        userActivation: rTMPL({ hasBeenActive: true, isActive: true }),
        virtualKeyboard: rTMPL({
          boundingRect: DOMRect,
          overlaysContent: false,
          ongeometrychange: null,
        }),
        connection: rTMPL({
          downlink: 10,
          effectiveType: "4g",
          onchange: null,
          rtt: 50,
          saveData: false,
        }),
        serial: rTMPL({
          controller: null,
          ready: Promise,
          oncontrollerchange: null,
          onmessage: null,
          onmessageerror: null,
        }),
        geolocation: rTMPL({
          getCurrentPosition: function (fs, fe, o) {
            fe({ code: 1, message: "User denied Geolocation" });
          },
          watchPosition: function (fs, fe, o) {
            fe({ code: 1, message: "User denied Geolocation" });
          },
        }),
        mimeTypes: rTMPL({
          0: "MimeType",
          1: "MimeType",
          2: "MimeType",
          3: "MimeType",
          "application/pdf": "MimeType",
          "application/x-google-chrome-pdf": "MimeType",
          "application/x-nacl": "MimeType",
          "application/x-pnacl": "MimeType",
          length: 4,
        }),
      });
      Object.defineProperty(window, "navigator", {
        value: navigator,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } +
    ')("' +
    addslashes(UserAgent) +
    '","' +
    addslashes(language) +
    '","' +
    addslashes(timezone) +
    '","' +
    addslashes(os) +
    '");';

  document.documentElement.setAttribute("onreset", actualCode);
  document.documentElement.dispatchEvent(new CustomEvent("reset"));
  document.documentElement.removeAttribute("onreset");
}
