const express = require('express');
const SocketServer = require('ws').Server;
const uuidV1 = require('uuid/v1');

const PORT = 3001;

const server = express()
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });


wss.on('connection', (ws) => {
  console.log('Client connected. We have ' + wss.clients.size + ' client(s) connected.');
  clientCount();
  // Handle messages
  ws.on('message', handleMessage);
  ws.on('close', function close() {
    clientCount();
    console.log('Client disconnected. We have ' + wss.clients.size + ' client(s) connected.');
  });
});

// Broadcast - Goes through each client and sends message data
wss.broadcast = function(data) {
  wss.clients.forEach(function(client) {
    
    // Parsed the data to add the auto-generated id
    let parsedData = JSON.parse(data);
    
    switch(parsedData.type) {
    // handle outgoing message
    case "postMessage":
      parsedData.type = "incomingMessage";
      parsedData.id = uuidV1();
      if(!parsedData.username) {
        parsedData.username = 'Anonymous';
      }
      break;
    //  handle outgoing notification
    case "postNotification":
      parsedData.type = "incomingNotification";
      break;
    }

    // Stringified it to send it back to the client side
    let dataSend = JSON.stringify(parsedData);
    client.send(dataSend);
  });
};

// Stores the current state and broadcasts it
function handleMessage(message) {
  wss.broadcast(message);
}

function clientCount(client) {
  let count = {type: "userCountChanged",
  userCount: wss.clients.size};
  let countSend = JSON.stringify(count);
  return wss.broadcast(countSend);
}
