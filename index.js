const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require('axios');
const moment = require('moment');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    console.log("join_room", data)
    socket.join(data);
  });

  socket.on("send_message", (data) => {
    console.log('send_message', data)
    console.log("log")
    socket.to(data.userId).emit("receive_message", data);
  });
});

app.get("/", (req, res) => {
  console.log("server is running");
  res.send("Server is running");
});

server.listen(808, () => {
  console.log("SERVER IS RUNNING 808");
});
