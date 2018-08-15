/*
    Synchronous
    index.js

    Brandon Asuncion <me@brandonasuncion.tech>
*/

const PORT = process.env.PORT || 80;

var http = require("http");
var express = require("express");
var app = express();

app.use(express.static(__dirname + "/public/"));

var server = http.createServer(app);
server.listen(PORT);

var io = require('socket.io')(server);

var lastBroadcastedData = {};

io.on('connection', function(socket) {

    socket.on('room', function(room) {
        if (room == null || room === "") {
            socket.disconnect(true);
            return;
        }

        socket.room = room;
        socket.join(room);
        
        if (typeof io.sockets.adapter.rooms[room] === "undefined" || io.sockets.adapter.rooms[room].length <= 1) {
            console.log("New Room: ", room)
            socket.isHost = true;
            socket.emit("host", { room: room });
        } else {

            console.log("Guest joining: ", room)
            socket.isHost = false;

            let lastPacket = lastBroadcastedData[room];
            lastPacket.serverTime = Date.now();

            socket.emit("guest", lastPacket);
        }
    });

    socket.on('sync', function(data) {
        if (socket.isHost) {
            
            // Convert timestamp to server time
            // https://en.wikipedia.org/wiki/Network_Time_Protocol#Clock_synchronization_algorithm
            // let now = Date.now();
            // let clientTime = new Date(data.timestamp);
            // let timeOffset = (now - clientTime) / 2;
            // let serverTime = new Date(now - timeOffset);

            // // data.clientTime = clientTime;
            // data.timestamp = serverTime;

            data.timestamp = Date.now();
            lastBroadcastedData[socket.room] = data;

            socket.broadcast.emit('sync', data);
        }
    });

});