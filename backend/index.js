// const PORT = process.env.PORT || 3001;


// var http = require("http");
// var express = require("express");
// var app = express();


var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(80);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
}

io.on('connection', function (socket) {

    console.log('New connection');
//     setInterval(function() {
//         //socket
//         //socket.emit('sync', {time: new Date})
//         io.to('hello').emit('sync', {time: new Date});
//     }, 1000);
    socket.emit('news', { hello: 'world' });

    // socket.on('my other event', function (data) {
    //     console.log(data);
    // });

    socket.on('room', function(room) {
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
            socket.emit("guest", { room: room });
        }
    });

    // socket.on('sync', function(id, msg) {
    //     console.log("Broadcasting " + msg + " to " + id);
    //     socket.broadcast.emit('sync', msg);

    //     //socket.broadcast.to(id).emit('sync', msg);
    //     // io.to(id).emit('sync', msg);
    // });

    socket.on('sync', function(data) {
        // console.log("Broadcasting time " + data['time'] + " to " + data['room']);
        if (socket.isHost) {
            socket.broadcast.emit('sync', data);
        }
    });

});