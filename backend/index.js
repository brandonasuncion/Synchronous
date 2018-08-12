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

io.on('connection', function (socket) {

    socket.on('room', function(room) {
        if (room == null || room === "") {
            socket.disconnect(true);
            return;
        }

        socket.room = room;
        socket.join(room);
        //console.log(io.sockets.adapter.rooms);
        if (typeof io.sockets.adapter.rooms[room] === "undefined" || io.sockets.adapter.rooms[room].length <= 1) {
            console.log("New Room: ", room)
            socket.isHost = true;
            socket.emit("host", { room: room });
        } else {

            console.log("Guest joining: ", room)
            socket.isHost = false;
            //socket.emit("guest", { room: room });
            let lastPacket = lastBroadcastedData[room];
            socket.emit("guest", lastPacket);
        }
    });

    // socket.on('sync', function(id, msg) {
    //     console.log("Broadcasting " + msg + " to " + id);
    //     socket.broadcast.emit('sync', msg);

    //     //socket.broadcast.to(id).emit('sync', msg);
    //     // io.to(id).emit('sync', msg);
    // });

    socket.on('sync', function(data) {
        if (socket.isHost) {

            // TODO: Convert timestamp to server time
            lastBroadcastedData[socket.room] = data;

            socket.broadcast.emit('sync', data);
        }
    });

    // if (socket.lastDataBroadcasted != null) {
    //     socket.emit('update', socket.lastDataBroadcasted);
    //     // if (socket.lastDataBroadcasted['paused']) {
    //     //     socket.emit('sync', socket.lastDataBroadcasted);
    //     // } else {

    //     // }
    // }


});