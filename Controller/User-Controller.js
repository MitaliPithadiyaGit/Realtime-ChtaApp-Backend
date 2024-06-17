import User from "../Schema/User-Schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../Schema/Message-Schema.js";
import SelectedUser from "../Schema/SelectUser-Schema.js";

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