//@ts-nocheck
export {};

function useProperties(properties) {
  // Find the proxy with isActive set to true
  const activeProxy = properties.proxies.find((proxy) => proxy.isActive);

  if (activeProxy) {
    const { language, timezone } = activeProxy;
    const UserAgent = properties.ua;

    // Call the setupUserAgentHook function with the retrieved values
    setupUserAgentHook(UserAgent, language, timezone);
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

function setupUserAgentHook(UserAgent, language, timezone) {
  // if (typeof UserAgent !== "string" && UserAgent == "") return false;
  if (UserAgent === "") return false;

  let os;

  if (UserAgent.indexOf("Windows") !== -1) {
    os = "Windows 10/11";
  } else if (UserAgent.indexOf("Mac") !== -1) {
    os = "Mac OS X";
  }

  function addslashes(str) {
    // Quote string with slashes
    return str.replace(/([\"\'])/g, "\\$1");
  }
  var actualCode =
    "(" +
    function (newUserAgent, language, timezone) {
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

      var navigator = Object.create(window.navigator);
      function rTMPL(o) {
        return {
          value: o,
          configurable: false,
          enumerable: true,
          writable: false,
        };
      }
      var ChromeV = newUserAgent.replace(/^.*Chrome\/(\d+).*$/gi, "$1");

      Object.defineProperties(navigator, {
        userAgent: rTMPL(newUserAgent),
        appVersion: rTMPL(newUserAgent),
        platform: rTMPL("Win32"),
        productSub: rTMPL("20030107"),
        language: rTMPL(language),
        languages: rTMPL(language),
        userAgentData: rTMPL({
          brands: [
            { brand: " Not A;Brand", version: ChromeV },
            { brand: "Chromium", version: ChromeV },
            { brand: "Google Chrome", version: ChromeV },
          ],
          mobile: false,
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
    '");';

  document.documentElement.setAttribute("onreset", actualCode);
  document.documentElement.dispatchEvent(new CustomEvent("reset"));
  document.documentElement.removeAttribute("onreset");
}
