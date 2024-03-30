const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

async function urlToBase64(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    const base64Data = Buffer.from(response.data, 'binary').toString('base64');
    console.log("Successfully converted URL to base64!");
    return base64Data;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

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

app.post("/base64", async function (req, res) {
  try {
    if (!req?.body || !req?.body?.url) {
      return res.status(400).json({ error: 'URL is missing in the request body' });
    }
    const url = req?.body?.url;
    const imageExtension = url?.split('.')?.pop();
    const base64Data = await urlToBase64(url);
    res.json({
      data: `data:image/${imageExtension};base64,${base64Data}`,
      success: true
    });
  } catch (error) {
    let errorMessage = 'Internal Server Error';
    if (error.response && error.response.status === 404) {
      errorMessage = 'Data not found';
    } else if (error.response && error.response.status === 403) {
      errorMessage = 'Forbidden: Access denied to the image';
    }  // Add more specific error handling as needed
    console.error('Error:', error);
    res.status(error?.response?.status ||500).json({ error: errorMessage });
  }
});

server.listen(808, () => {
  console.log("SERVER IS RUNNING 808");
});
