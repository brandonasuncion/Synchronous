'use strict';

var synchronous = window.synchronous || {};
window.synchronous = synchronous;
synchronous.syncServer = "https://sync-.herokuapp.com/";

synchronous.room = null;
synchronous.isActive = false;
synchronous.statusText = null;
synchronous.isHost = false;
synchronous.isPaused = false;

synchronous.updateStatus = function(status) {
    this.statusText = status;
    console.log(status);
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
    
    this.isActive = true;
    this.room = roomID;

    synchronous.updateStatus("Connecting to " + roomID);
    var socket = io(this.syncServer);

    // Send room name once connected
    socket.on('connect', function() {
        socket.emit('room', roomID);
        synchronous.updateStatus("Connected to " + roomID);
    });

    socket.on('connect_error', function() {
        synchronous.isActive = false;
        synchronous.updateStatus("Cannot connect to server");
    });

    socket.on('disconnect', function(reason) {
        synchronous.isActive = false;
        synchronous.updateStatus("Disconnected");
    });

    // Client is the host of the room
    socket.on('host', function() {
        var video = document.querySelector('video');
        if (video == null) {
            synchronous.updateStatus("No video available");
            socket.disconnect(true);
            return;
        }

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
            console.log(data, video.readyState);

        };

        // video.addEventListener("seeked", function() { synchronous.updatePlayPauseStatus() });

        // video.addEventListener("play", updateStatus);
        video.addEventListener("playing", updateStatus);
        video.addEventListener("pause", updateStatus);

        video.addEventListener("seeking", updateStatus);

        // may need to remove one these lines
        video.addEventListener("seeked", updateStatus);
        video.addEventListener("waiting", updateStatus);

        updateStatus();
    });

    // Client is a guest of the room; Update using the last recorded timestamp
    socket.on('guest', function(data) {
        if (data['room'] != roomID) { return; }

        synchronous.isHost = false;
        synchronous.updateStatus("Connected: " + roomID);

        var video = document.querySelector('video');
        if (video == null) { return; }
        synchronous.isPaused = data['paused'];

        if (data['paused']) {
            // video.pause();
            video.currentTime = data['videoTime'];

        } else {

            // TODO: Convert timestamp from server time to local time

            var now = new Date();
            var timestamp = new Date(data['timestamp']);
            var timeDelta = (now - timestamp) / 1000;
            video.currentTime = data['videoTime'] + timeDelta;

            // video.play();
            // console.log("PLAYING");
            // synchronous.updatePlayPauseStatus();
        }

        synchronous.updatePlayPauseStatus();
        video.addEventListener("seeked", function() { synchronous.updatePlayPauseStatus() });
    });

    // Guest receives a sync event; Update player to match host's player
    socket.on('sync', function(data) {
        if (data['room'] != roomID) { return; }

        var video = document.querySelector('video');
        if (video == null) { return; }
        synchronous.isPaused = data['paused'];

        // video.currentTime = data['videoTime'];
        // synchronous.updatePlayPauseStatus();

        if (video.paused != synchronous.isPaused) {
            
            // if (synchronous.isPaused) {
            //     video.pause();
            //     console.log("PAUSED");
            // } else {
            //     video.currentTime = data['videoTime'];
            //     // video.play();
            //     synchronous.updatePlayPauseStatus();
            //     console.log("PLAYING");
            // }

            if (!synchronous.isPaused) {
                video.currentTime = data['videoTime'];
            }
            synchronous.updatePlayPauseStatus();

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

};

synchronous.updatePlayPauseStatus = function() {

    var video = document.querySelector('video');
    if (video == null) { return; }

    if (video.paused === this.isPaused) {
        return;
    }

    if (this.isPaused) {
        video.pause();
        console.log("PAUSE");

        setTimeout(function() { synchronous.updatePlayPauseStatus() }, 100);

    } else {
        //video.play().then(() => this.updatePlayPauseStatus());
        let playPromise = video.play();

        console.log("PLAY");
        
        if (playPromise !== undefined) {
            playPromise
                .then(_ => this.updatePlayPauseStatus())
                .catch(_ => this.updatePlayPauseStatus())
        } else {
            // this.updatePlayPauseStatus();
        }
    }

};