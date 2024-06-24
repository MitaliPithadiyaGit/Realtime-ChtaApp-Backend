// WebSocket setup in server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { WebSocketServer } from 'ws';
import http from 'http';
import Connection from "./Database/Db.js";
import Routes from "./Routes/Route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware setup
app.use(cors());
app.use(bodyParser.json({ extend: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use("/", Routes);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your React app's URL
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

// Database connection
const url = process.env.DB_CONNECT;
Connection(url);

// WebSocket server logic
const clients = {};

wss.on('connection', (ws, req) => {
  const userId = new URLSearchParams(req.url.split('?')[1]).get('userId');
  if (!userId) {
    ws.close();
    return;
  }

  clients[userId] = ws;

  ws.on('message', (message) => {
    try {
      const { sender, receiver, message: msg } = JSON.parse(message);
      const receivedTimestamp = new Date().toISOString();
      if (clients[receiver]) {
        clients[receiver].send(JSON.stringify({ sender, message: msg, timestamp: receivedTimestamp }));
      } else {
        console.log(`Receiver ${receiver} not found`);
      }
    } catch (error) {
      console.error('Error parsing or sending message:', error);
    }
  });

  ws.on('close', () => {
    delete clients[userId];
    console.log(`WebSocket closed for user ${userId}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
