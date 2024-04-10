const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require('axios');
const moment = require('moment');
const bodyParser = require('body-parser');
const { LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrimage = require('qr-image');
const fs = require('fs');
const { createClient } = require("./whatsup/client");

// const wwebVersion = '2.2407.3';

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

app.get("/whatsapp", async (req, res) => {
  console.log("req123123", req.query)
  const { name } = req.query;
  if (!name) {
    res.send("Enter Username!")
  }
  const client = await createClient(name);
  // When the client is ready, run this code (only once)
  client.once('ready', () => {
    console.log('Client is ready!');
    // res.send('Client is ready!');
  });

  // When the client received QR-Code
  // client.on('qr', (qr) => {
  //     console.log('QR RECEIVED', qr);
  //     qrcode.generate(qr, {small: true});
  //     res.send({
  //         qr: qr
  //     });
  // });
  // When the client received QR code
  client.on('qr', async (qr) => {
    console.log('QR code received:', qr);
    var code = qrimage.image(qr, { type: 'svg' });
    res.type('svg');
    code.pipe(res);
  });

  // Listening to all incoming messages
  client.on('message_create', message => {
    console.log("===>>", message.body);
    console.log("===>> message", message);
  });

  client.on('message_create', async message => {
    // if (message.body === 'hello') {
    // 	// send back "pong" to the chat the message was sent in
    // 	client.sendMessage(message.from, 'Hello I am Piyush. I am here to help you.');
    // }
    if (message.body === 'Hi') {
      console.log("sent message  ===============>>>>>>>>>>> ");
      console.log("message123123", message);
      try {
        // const media = await MessageMedia.fromUrl('https://report.taxfile.co.in/Report/TransactionReport?CompanyID=267&CGuid=/B0AYJVEE-RUMGHRXI-QB0XH34M/&ReportMode=Sales&custid=taxfilecrm&ExportMode=IMG');
        // const media = await MessageMedia.fromUrl('https://report.taxfile.co.in/HTMSRC.JPEG', { unsafeMime: true, filename: 'image.jpg' });
        // client.sendMessage(message.from, media, {caption: "image" } );

        // const media = await MessageMedia.fromUrl('https://report.taxfile.co.in/HTMSRC.JPEG');
        //  const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
        const bas = await urlToBase64('https://report.taxfile.co.in/HTMSRC.JPEG');
        const media = await new MessageMedia("image/jpeg", bas, "image.jpg");
        await client.sendMessage(message.from, media, { caption: "my image" });


      } catch (error) {
        console.error('Error downloading content:', error);
      }
    }
  });


  client.on('message', async (msg) => {
    const chat = await msg.getChat();
    console.log('chat', chat)
    let user = await msg.getContact();
    console.log('user', user)
    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      console.log('media', media)
      // do something with the media data here
    }
  });



  // Start your client
  client.initialize();
})

// Function to make the API call
const callApi = async () => {
  const todayDate = moment().format('YYYY-MM-DD')
  try {
    await axios.get(`https://report.taxfile.co.in/Report/TaskSummaryReportCustom?CompanyID=267&ReportMode=EXPORT&custid=taxfilecrm&PartyId=0&TaskStatus=&startdate=${todayDate}&endDate=${todayDate}&AssignTo=&AssignBy=&ProjectId=0&CategoryId=0&TaxadminId=0&TaskType=Task&ToMail=shyamkhokhariya97@gmail.com&Subject=Task Report ${todayDate}`, {
      mode: 'no-cors'
    });
    console.log(`Report sent to successfully: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Error calling API:', error.message);
  }
};
// Calculate the time until the next 6:30 PM
const calculateNextCallTime = () => {
  const now = new Date();
  const nextCallTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    18, // 6:30 PM
    30,
    0
  );
  if (nextCallTime <= now) {
    nextCallTime.setDate(nextCallTime.getDate() + 1); // Next day
  }
  return nextCallTime.getTime() - now.getTime();
};

// // Call the API initially
// callApi();

// // Set interval to call the API daily at 6:30 PM
// const interval = calculateNextCallTime();
// setTimeout(() => {
//   callApi();
//   setInterval(callApi, 24 * 60 * 60 * 1000); // Repeat every 24 hours
// }, interval);

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
