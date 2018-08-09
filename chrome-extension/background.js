chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
});

// function checkForValidUrl(tabId, changeInfo, tab) {
//     chrome.pageAction.show(tabId);
// };

// chrome.tabs.onUpdated.addListener(checkForValidUrl);