const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

// Enable CORS for all connections
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store connected users {socket.id: name}
const users = {};
const PORT = 8000;

// Start the server
server.listen(PORT, () => {
    console.log(`✅ Server is running and listening on port ${PORT}...`);
});

// Socket.IO connection handler
io.on('connection', socket => {
    console.log("🟢 New connection:", socket.id);

    // 1️⃣ New user joins
    socket.on('new-user-joined', name => {
        console.log(`👤 ${name} joined`);
        users[socket.id] = name;
        socket.broadcast.emit('user-joined', name);
    });

    // 2️⃣ Message sending
    socket.on('send', data => {
        // Broadcast message to all except sender
        socket.broadcast.emit('receive', { data, name: users[socket.id] });
    });

    // 3️⃣ User disconnects
    socket.on('disconnect', () => {
        const name = users[socket.id];
        if (name) {
            console.log(`🔴 ${name} left`);
            socket.broadcast.emit('left', name);
            delete users[socket.id];
        }
    });
});
