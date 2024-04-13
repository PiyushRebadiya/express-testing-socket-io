const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const moment = require('moment');
const bodyParser = require('body-parser');
const { LocalAuth, Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// const wwebVersion = '2.2407.3';

app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

let qrCodeData = null;
let whatsupConnect = null;
let whatsupDisconnect = null;
let number = 1;

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

  if (qrCodeData) {
    socket.to(qrCodeData.userId).emit("receive_qr", {
      qr: qrCodeData.qr,
      userId: qrCodeData.userId,
    });
    qrCodeData = null;
  }

  if (whatsupConnect) {
    socket.to(whatsupConnect.userId).emit("whatsup_connect", {
      status: whatsupConnect.status,
      userId: whatsupConnect.userId,
    });
    whatsupConnect = null;
  }
  if (whatsupDisconnect) {
    socket.to(whatsupDisconnect.userId).emit("whatsup_disconnect", {
      status: whatsupDisconnect.status,
      userId: whatsupDisconnect.userId,
    });
    whatsupDisconnect = null;
  }
});

app.get("/", (req, res) => {
  console.log("server is running");
  res.send("Server is running");
});

const session = async (req, res, name, userId) => {
  const wwebVersion = '2.2407.3';
  // req.whatsupWeb
  const client = await new Client({
    // const client = await new Client({
    authStrategy: new LocalAuth({ clientId: name }), // Set clientId dynamically
    puppeteer: { },
    webVersionCache: {
      type: 'remote',
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
  });

  // if(client?.info){
  //   console.log('==>>>>>> Client is ready!');
  //   return client
  // }

  // When the client is ready, log a message
  client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    // res.send("ready");
    whatsupConnect = { status: true, userId: userId };
    io.emit("whatsup_connect", { status: true, userId: userId });
  });
  client.on('authenticated', () => {
    console.log('authenticated ===>>>>>>>>> !');
    // res.send("ready");
  });

  // When the client received QR code
  client.on('qr', async (qr) => {
    console.log('QR code received:', qr);
    if (number === 2) {
      qrCodeData = null;
      client.destroy();
      number = 1;
      return
    }
    qrcode.generate(qr, { small: true });
    qrCodeData = { qr, userId: userId }; // Store the QR code data
    io.emit("receive_qr", { qr, userId: userId });
    number = number + 1;
    // var code = qrimage.image(qr, { type: 'svg' });
    // res.type('svg');
    // code.pipe(res);
    // res.send({
    //   qr
    // });

  });

  // When the client is disconnected, log a message and logout the user
  client.on('disconnected', () => {
    console.log('WhatsApp Client is disconnected!');
    // client.disconnect();
    // client.logout();
    // res.send("disconnected");
    whatsupDisconnect = { status: true, userId: userId };
    io.emit("whatsup_disconnect", { status: true, userId: userId });
    client.destroy();
  });

  await client.initialize();
  // next();
  return client
}

app.get("/whatsapp", async (req, res) => {
  // res.send("Server is running whatup");
  const { name, userId } = req.query;
  console.log('name :>> ', name);
  const todayDate = moment().format('YYYY-MM-DD hh:mm:ss');
  try {
    const client = await session(req, res, name, userId);
    const users = "9484573294,9712125572,8758185140,9737009734,9723271041,9689301548,9727950927,7405409918"
    const usersList = users.split(",");

    for (let i = 0; i < usersList.length; i++) {
      const user = usersList[i];
      await client.sendMessage(`91${user}@c.us`, `Time ${todayDate} ${name} userId:${userId}`).then((r) => {
        console.log("sendMessage", r)
      })
    }
    await res.send({
      status: "true",
      message: "Message sent successfully!"
    });

    setTimeout(async () => {
      await client.destroy();
    }, 2000);
    // await client.destroy();
  } catch (error) {
    console.log('error :>> ', error);
    res.status(500).send(error?.message || 'Something went wrong');
  }
})

server.listen(808, () => {
  console.log("SERVER IS RUNNING 808");
});
