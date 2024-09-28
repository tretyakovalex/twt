// websocket.js
const WebSocket = require('ws');
// const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 4300 });
let clients = [];

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.push(ws);

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

const sendMessageToClients = (message) => {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message, { binary: true }, (err) => {
                if (err) console.error('Error sending message:', err);
            });
        }
    });
};

module.exports = { sendMessageToClients };

// wss.on('connection', (ws) => {
//     const clientId = uuidv4();
//     clients.push({ ws, clientId });
//     ws.on('close', () => {
//       clients = clients.filter(client => client.clientId !== clientId);
//     });
// });
  
// function notifyClient(clientId, data) {
//     clients.forEach((client) => {
//         if (client.clientId === clientId && client.ws.readyState === WebSocket.OPEN) {
//             client.ws.send(JSON.stringify(data));
//         }
//     });
// }

// module.exports = { notifyClient };
