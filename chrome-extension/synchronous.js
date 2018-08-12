'use strict';

var synchronous = {};
window.synchronous = synchronous;
synchronous.syncServer = "https://sync-.herokuapp.com/";

synchronous.room = null;
synchronous.statusText = null;
synchronous.isHost = false;
synchronous.isPaused = false;

synchronous.updateStatus = function(status) {
    this.statusText = status;
    chrome.runtime.sendMessage({ statusUpdate: status }, function(response) { });
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "requestStatus")
        sendResponse({
            room: synchronous.room,
            statusText: synchronous.statusText
        });
});


synchronous.syncVideo = function(roomID) {
    
    this.room = roomID;

    console.log('Connecting to', roomID);
    var socket = io(this.syncServer);

    // Send room name once connected
    socket.on('connect', function() {
        socket.emit('room', roomID);
        synchronous.updateStatus("Connected to " + roomID);
    });

    socket.on('connect_error', function() {
        synchronous.updateStatus("Cannot connect to server");
    });

    socket.on('disconnect', function(reason) {
        synchronous.updateStatus("Disconnected");
        console.log("Disconnected", reason)
    });

    // Client is the host of the room
    socket.on('host', function() {
        var video = document.querySelector('video');
        if (video == null) {
            synchronous.updateStatus("No video available");
            socket.disconnect(true);
            return;
        }

        console.log("Hosting:", roomID);

        synchronous.isHost = true;
        synchronous.updateStatus("Hosting: " + roomID);

        var lastSentData = {};
        var updateStatus = function(paused) {
            var data = {
                room: roomID,
                videoTime: video.currentTime,
                // paused: paused == null ? video.paused || video.seeking || video.playbackRate == 0 : paused,
                // paused: video.playbackRate == 0,
                paused: video.paused || video.seeking || video.playbackRate == 0,
                timestamp: new Date()
            };

            // Cancel sending an update if it is redundant
            if (lastSentData.room == data.room && lastSentData.videoTime == data.videoTime && lastSentData.paused == data.paused) {
                return;
            }
            lastSentData = data;

            socket.emit('sync', data);
            console.log(data);
        };

        // video.addEventListener("play", updateStatus);
        video.addEventListener("playing", updateStatus);
        video.addEventListener("pause", updateStatus);

        // video.addEventListener("ratechange", updateStatus);

        video.addEventListener("seeking", updateStatus);
        video.addEventListener("seeked", updateStatus);
        video.addEventListener("waiting", updateStatus);

        updateStatus();
    });

    // Client is a guest of the room; Update using the last recorded timestamp
    socket.on('guest', function(data) {
        if (data['room'] != roomID) { return; }

        console.log("Joining:", data['room']);

        synchronous.isHost = false;
        synchronous.updateStatus("Connected: " + roomID);

        var video = document.querySelector('video');
        if (video == null) { return; }


        if (data['paused']) {
            video.pause();
            video.currentTime = data['videoTime'];

        } else {

            // TODO: Convert timestamp from server time to local time

            var now = new Date();
            var timestamp = new Date(data['timestamp']);
            var timeDelta = (now - timestamp) / 1000;
            video.currentTime = data['videoTime'] + timeDelta;

            video.play();
            console.log("PLAYING");
        }
    });

    // Guest receives a sync event; Update player to match host's player
    socket.on('sync', function(data) {
        // console.log("Received sync:", data);
        if (data['room'] != roomID) { return; }

        var video = document.querySelector('video');
        if (video == null) { return; }
        synchronous.isPaused = data['paused'];

        if (video.paused != synchronous.isPaused) {
            
            if (synchronous.isPaused) {
                video.pause();
                console.log("PAUSED");
            } else {
                video.currentTime = data['videoTime'];
                video.play();
                console.log("PLAYING");
            }

        } else if (Math.abs(video.currentTime - data['videoTime']) > 1) {
            video.currentTime = data['videoTime'];
        }

        // video.currentTime = data['videoTime'];
        // let updateStateIfNeeded = () => {
        //     if (video.paused != synchronous.isPaused) {
            
        //         if (synchronous.isPaused) {
        //             video.pause();
        //             console.log("PAUSED");
        //         } else {
                    
        //             video.play().then(updateStateIfNeeded);
        //             console.log("PLAYING");
        //         }
    
        //     }
        // };
        // updateStateIfNeeded();

    });

}