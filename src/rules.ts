//@ts-nocheck

const allResourceTypes = Object.values(
  chrome.declarativeNetRequest.ResourceType
);

const rules: chrome.declarativeNetRequest.Rule[] = [
  {
    id: 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "Accept-Language",
          value: "ro-RO",
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: allResourceTypes,
    },
  },
  {
    id: 2,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "Time-Zone",
          value: "Europe/Bucharest",
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: allResourceTypes,
    },
  },
  {
    id: 3,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "user-agent",
          value:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: allResourceTypes,
    },
  },
  {
    id: 4,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: "sec-ch-ua-platform",
          value: "macOS",
        },
      ],
    },
    condition: {
      urlFilter: "*",
      resourceTypes: allResourceTypes,
    },
  },
  {
    id: 5,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
    },
    condition: {
      resourceTypes: ["sub_frame"],
      urlFilter: "|http|https",
    },
  },
];

export default rules;
