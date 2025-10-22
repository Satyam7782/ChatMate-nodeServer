// index.js (Node.js Server)

const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Use environment variable PORT provided by the host (like Render), or default to 8000 for local development.
const PORT = process.env.PORT || 8000; 

// --- Express Middleware and Routing ---

// Serve static frontend files from a directory relative to the project structure.
// Assuming your directory structure is: ChatMate/app/nodeServer/index.js
// and your client files are in: ChatMate/app/public/
// If you put your public folder next to nodeServer, adjust the '..' as needed.
app.use(express.static(path.join(__dirname, "../public")));

// Route to serve the main HTML file when accessing the root URL (e.g., https://yourdomain.com/)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// --- Socket.IO Setup ---

// Enable CORS for Socket.IO connections (required for the web client to connect)
const io = new Server(server, {
    cors: {
        origin: "*", // Allows connections from any domain (best for development/free tiers)
        methods: ["GET", "POST"]
    }
});

// Store connected users {socket.id: name}
const users = {};

// --- Socket.IO Connection Handler ---

io.on("connection", (socket) => {
    console.log("🟢 New connection:", socket.id);

    // 1️⃣ New user joins
    socket.on("new-user-joined", (name) => {
        if (!name) return; // Basic check for empty name
        console.log(`👤 ${name} joined`);
        users[socket.id] = name;
        // Notify all other users that a new user has joined
        socket.broadcast.emit("user-joined", name);
    });

    // 2️⃣ Message sending
    socket.on("send", (message) => {
        // Broadcast the message (data) to all sockets EXCEPT the sender
        socket.broadcast.emit("receive", { message: message, name: users[socket.id] });
    });

    // 3️⃣ User disconnects
    socket.on("disconnect", () => {
        const name = users[socket.id];
        if (name) {
            console.log(`🔴 ${name} left`);
            // Notify all other users that someone has left
            socket.broadcast.emit("left", name);
            delete users[socket.id];
        }
    });
});

// --- Start the Server ---

server.listen(PORT, () => {
    console.log(`✅ Server is running and listening on port ${PORT}...`);
});