import User from "../Schema/User-Schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const userRegister = async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }
  
      user = new User({
        username,
        email,
        password,
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
  
      const payload = {
        user: {
          id: user.id,
        },
      };
  
      jwt.sign(payload, "jwtSecret", { expiresIn: "1h" }, (err, token) => {
        if (err) throw err;
        res.json({ token });
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
      },
    };

    jwt.sign(payload, "jwtSecret", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export const getUser = async (req, res) => {
    try {
        // Access user ID from decoded JWT payload
        const userId = req.user.id;
    
        // Fetch user data from the database using the user ID
        const user = await User.findById(userId).select('-password');
        
        res.json(user);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
};