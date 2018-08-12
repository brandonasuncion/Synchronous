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
            socket.emit("guest", lastPacket);
        }
    });

    socket.on('sync', function(data) {
        if (socket.isHost) {
            
            // TODO: Convert timestamp to server time
            lastBroadcastedData[socket.room] = data;

            socket.broadcast.emit('sync', data);
        }
    });

});