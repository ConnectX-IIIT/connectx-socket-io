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

server.listen(port);

const io = socketIO(server);

let users = [];

const addUser = (userId, userName, room, socketId) => {

    const user = { userId, socketId, userName, room }
    !users.some((user) => user.userId === userId) && userId !== null && users.push(user);
    return user;
}

const getUser = (userId) => {
    let user = users.find((user) => user.userId === userId)
    return user;
}

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
}

io.on("connection", (socket) => {

    socket.on("addUser", (userId, userName, room) => {
        const user = addUser(userId, userName, room, socket.id);
        socket.join(user.room);
        io.emit("getUsers", users);
    });

    socket.on("sendMessage", async ({ senderId, senderName, receiverId, text, isGroup }) => {
        if (isGroup) {
            const user = await getUser(senderId);
            socket.in(user.room).emit("getMessage", {
                room: user.room,
                message: {
                    senderId,
                    senderName,
                    text,
                }
            });
        } else {
            const user = await getUser(receiverId);
            io.to(user.socketId).emit("getMessage", {
                room: "",
                message: {
                    senderId,
                    senderName,
                    text,
                }
            });
        }
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
})