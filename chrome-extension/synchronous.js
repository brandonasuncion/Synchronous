'use strict';

const SYNC_SERVER = "http://127.0.0.1/"

window.synchronous = {};
window.synchronous.syncVideo = function(roomID) {
    
    var socket = io(SYNC_SERVER);

    // Send room name once connected
    socket.on('connect', function() {
        console.log('Connecting to', roomID);
        socket.emit('room', roomID);
    });

    // Client is the host of the room
    socket.on('host', function() {
        console.log("Hosting:", roomID)

        var video = document.querySelector('video');
        if (video == null) { return; }

        var lastSentData = {};
        var updateStatus = function() {
            var data = {
                room: roomID,
                videoTime: video.currentTime,
                paused: video.paused || video.seeking,
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


        video.addEventListener("play", updateStatus);
        video.addEventListener("pause", updateStatus);
        video.addEventListener("seeking", updateStatus);
        video.addEventListener("seeked", updateStatus);
        video.addEventListener("suspend", updateStatus);

        updateStatus();
    });

    // Client is a guest of the room; Update using the last recorded timestamp
    socket.on('guest', function(data) {
        console.log("Joining:", data['room']);

        if (data['room'] != roomID) { return; }

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

        if (video.paused != data['paused']) {
            
            if (data['paused']) {
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

    });

}