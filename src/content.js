function setupUserAgentHook(UserAgent) {
  if (typeof UserAgent !== "string" && UserAgent == "") return false;
  function addslashes(str) {
    // Quote string with slashes
    return str.replace(/([\"\'])/g, "\\$1");
  }
  var actualCode =
    "(" +
    function (newUserAgent) {
      "use strict";

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
        language: rTMPL("en-US"),
        languages: rTMPL(["en-US", "en"]),
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
    '");';

  document.documentElement.setAttribute("onreset", actualCode);
  document.documentElement.dispatchEvent(new CustomEvent("reset"));
  document.documentElement.removeAttribute("onreset");
}
setupUserAgentHook("Agent 007");
