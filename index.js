const http = require('http');
const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');

const app = express();
const port = process.env.PORT;

app.use(cors());
app.get("/", (req, res) => {
    res.send("Hello world!");
})

const server = http.createServer(app);

app.listen(port);

const io = socketIO(server);

let users = [];

const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) && userId !== null &&
        users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users);
    });

    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        const user = getUser(receiverId);
        io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
        });
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
})