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
app.use("/", Routes);

app.use("/",(req,res)=>{
  res.send("Server is running")
})
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

      if (clients[receiver]) {
        clients[receiver].send(JSON.stringify({ sender, message: msg }));
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

import express from "express";
import { EditSelectedUser, GetLastMessage, createMessage, getAllUsers, getMessages, getSelectedUser, getUserById, userLogin, userRegister } from "../Controller/User-Controller.js";
import auth from "../Middleware/Auth-Middleware.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); 
    }
  });
  
  const upload = multer({ storage: storage });

router.post("/register",upload.single('image'),userRegister);
router.post("/login",userLogin);
router.get("/user/:id",auth,getUserById);
router.get("/users", auth, getAllUsers); 
router.post("/messages", auth, createMessage); 
router.get("/getmessages", auth, getMessages); 
router.get("/getselectedusers", auth, getSelectedUser); 
router.put("/selected-users", auth, EditSelectedUser); 
router.get("/getlastmessage", auth, GetLastMessage); 
export default router;

import User from "../Schema/User-Schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../Schema/Message-Schema.js";

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const userRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image" });
  }

    user = new User({
      username,
      email,
      password,
      image: req.file.path,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password:user.password,
        image: req.file.path,
      },
    };

    jwt.sign(payload, "jwtSecret", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ data: {...payload.user, token} });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

  

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password:user.password,
      },
    };

    jwt.sign(payload, "jwtSecret", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ data: {...payload.user, token} });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the provided userId is a valid ObjectId
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ msg: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-password");
    
    // Check if the user with the provided ID exists
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// export const getUserById = async (req, res) => {
//   const userId = req.params.id;

//   try {
//     const user = await User.findById(userId).select("-password");; // Adjust to match your data fetching logic
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const createMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    // Check if sender and receiver are valid user IDs
    if (!isValidObjectId(sender) || !isValidObjectId(receiver)) {
      return res.status(400).json({ msg: 'Invalid sender or receiver ID' });
    }

    // Check if sender and receiver exist
    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);
    if (!senderUser || !receiverUser) {
      return res.status(404).json({ msg: 'Sender or receiver not found' });
    }

    const newMessage = new Message({
      sender,
      receiver,
      message,
    });

    await newMessage.save();

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;

    // Query messages based on sender and receiver IDs
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }, // to get both sides of the conversation
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const getSelectedUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('selectedUsers');
    res.json(user.selectedUsers);
  } catch (error) {
    console.error('Error fetching selected users:', error);
    res.status(500).send('Server error');
  }
};

// Update selected users for a user
export const EditSelectedUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedUsers } = req.body;

    const user = await User.findById(userId);
    user.selectedUsers = selectedUsers;
    await user.save();

    res.json(user.selectedUsers);
  } catch (error) {
    console.error('Error updating selected users:', error);
    res.status(500).send('Server error');
  }
};
export const GetLastMessage = async (req, res) => {
  
  // Fetch the last message from the database
  try {
    const { sender, receiver } = req.query;
    const lastMessage = await Message.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ timestamp: -1 }); // Assuming `timestamp` is the field to sort by

    if (!lastMessage) {
      return res.status(404).json({ message: 'No messages found' });
    }

    res.json(lastMessage);
  } catch (error) {
    console.error('Error fetching last message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import mongoose from "mongoose";

const Connection = async(url)=>{
    const URL = `${url}`;
    try{
       await mongoose.connect(URL,{useUnifiedTopology:true,useNewUrlParser:true})
        console.log("Database Connected SuccessFully");
    }
    catch(error){
        console.log("Error Whileconnected to the Database:",error);
    }
}


export default Connection;

import React, { useContext, useState } from 'react';
import { getUser, registerUser } from '../API/Api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import { Button, Container, Link, Paper, TextField, Typography } from '@mui/material';
import  {NotificationManager } from 'react-notifications';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    image: null, // Add image field
  });

  const navigate = useNavigate();

  const { username, email, password, image } = formData;

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      setFormData({ ...formData, image: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const { setUser } = useContext(AuthContext);

  const handleSignUp = async (e) => {
    e.preventDefault();
  
    try {
      const formDataToSend = new FormData(); // Create a new FormData instance
      formDataToSend.append('username', username);
      formDataToSend.append('email', email);
      formDataToSend.append('password', password);
      formDataToSend.append('image', image); // Add image to FormData
  
      const response = await registerUser(formDataToSend);
  
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.id); 
         // Store user ID in localStorage
         const id = response.data.id
        const userData = await getUser();
        setUser(userData
          // image: URL.createObjectURL(image) 
        );
        console.log(image);
        NotificationManager.success('User registered successfully!', 'Success');
        navigate(`/chat-dashboard/${id}`); // Redirect to ChatDashboard
      }
  
      console.log(response);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register user';
      NotificationManager.error(errorMessage, 'Error');
      throw new Error('Failed to register user');
    }
  };
  

  return (
    <Container maxWidth="sm" sx={{ padding: 3, marginTop: 10 }}>
        <Paper elevation={3} sx={{ padding: 3, marginTop: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Sign Up
          </Typography>
            <TextField
              label="Name"
              name="username"
              type="text"
              id="Name"
              fullWidth
              margin="normal"
              variant="outlined"
              required
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              id="Email"
              fullWidth
              margin="normal"
              variant="outlined"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              label="Password"
              name="password"
              id="Password"
              fullWidth
              margin="normal"
              type="password"
              variant="outlined"
              required
              value={formData.password}
              onChange={handleChange}
            />
             <TextField
              fullWidth
              type="file"
              name="image"
              margin="normal"
              onChange={handleChange}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
              onClick={handleSignUp}
            >
              Sign Up
            </Button>
          <div style={{ marginLeft: 254, marginTop: 10 ,fontFamily:"system-ui",fontWeight:600,fontSize:17 }}>
            Already have an Account?{" "}
            <Link style={{ color: "blue" }} href="/login">
              Login
            </Link>
          </div>
        </Paper>
      </Container>
  );
};

export default Register;

useEffect(() => {
  const connectWebSocket = () => {
    ws.current = new WebSocket(`ws://realtime-chatapp-backend.vercel.app?userId=${userId}`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        console.log("Message received from WebSocket:", event.data);
        const { sender, message, timestamp } = JSON.parse(event.data);
        const receivedTimestamp = new Date().toISOString();

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender, message, timestamp: receivedTimestamp },
        ]);
        setSelectedUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === sender
              ? { ...user, lastMessage: { sender, message, timestamp } }
              : user
          )
        );
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      // Attempt to reconnect WebSocket here if needed
      connectWebSocket(); // Example: immediate attempt to reconnect
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Handle WebSocket errors here
    };
  };

  if (userId) {
    connectWebSocket();
  }

  return () => {
    if (ws.current) {
      ws.current.close();
    }
  };
}, [userId, setSelectedUsers, receiverId]);