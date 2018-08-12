let roomTextField = document.getElementById('room');
let joinRoomBtn = document.getElementById('joinRoomBtn');
let statusText = document.getElementById('statusText');

joinRoomBtn.onclick = function(element) {
    var room = roomTextField.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id, {
            code: "window.synchronous.syncVideo('" + room + "');"
        });
    });
};

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         console.log(request.statusUpdate, sender);

//         statusText.innerText = request["statusUpdate"] || "Error";

//     //   console.log(sender.tab ?
//     //               "from a content script:" + sender.tab.url :
//     //               "from the extension");
//     //   if (request.greeting == "hello")
//     //     sendResponse({farewell: "goodbye"});
//     }
// );



function updateStatusText() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "requestStatus"}, function(data) {
            roomTextField.value = data.room;
            statusText.innerText = data.statusText || "Not connected";
        });
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        updateStatusText();
    }
);

updateStatusText();

// chrome.browserAction.onClicked.addListener(function(e) {
//     updateStatusText();
// });


function joinRoomInNewTab(room, url) {
    chrome.tabs.create({"url": url}, function(tab) {
        chrome.tabs.executeScript(tab.id, {
            code: "window.synchronous.syncVideo('" + room + "');"
        });
    });
}