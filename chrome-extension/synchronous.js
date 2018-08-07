'use strict';

const SYNC_SERVER = "http://127.0.0.1/"

var roomID = "hello";

console.log("Synchronous Started");

// var socket = io();
var socket = io(SYNC_SERVER);
// var socket = io.connect(SYNC_SERVER);


// io.on('connection', function(socket){
//     socket.join('hello');
//     console.log('Joining hello');

//     setInterval(function() {
//         //socket
//         //socket.emit('sync', {time: new Date})
//         io.to('hello').emit('sync', {time: new Date});
//     }, 1000);


// });


socket.on('connect', function() {
    //socket.join('hello');
    socket.emit('room', roomID);
});


socket.on('host', function() {
    console.log("Hosting:", roomID)

    setInterval(function() {
        //socket

        var video = document.querySelector('video');

        if (video != null) {
            var data = {
                room: roomID,
                videoTime: video.currentTime,
                paused: video.paused,
                timestamp: new Date
            };
    
            socket.emit('sync', data);
        }

    }, 1000);
});

socket.on('guest', function() {
    console.log("Joining:", roomID);
});

socket.on('sync', function(data) {
    console.log("Received sync:", data);
    if (data['room'] != roomID) { return; }

    var video = document.querySelector('video');

    if (video != null) {

        if (Math.abs(video.currentTime - data['videoTime']) > 1) {
            video.currentTime = data['videoTime'];
        }

        if (video.paused != data['paused']) {
            if (data['paused']) {
                video.pause();
                console.log("PAUSED");
            } else {
                video.play();
                console.log("PLAYING");
            }

        }
    }

});