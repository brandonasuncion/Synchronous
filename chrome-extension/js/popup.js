let roomTextField = document.getElementById('room');
let joinRoomBtn = document.getElementById('joinRoomBtn');

joinRoomBtn.onclick = function(element) {
    var room = roomTextField.value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id, {
            code: "window.synchronous.syncVideo('" + room + "');"
        });
    });
};