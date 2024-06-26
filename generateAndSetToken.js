import jwt from "jsonwebtoken";
import crypto from "crypto"
import fs from "fs"
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

// Define the payload
const payload = {
  user: {
    id: "1234567890", // Example user ID
    username: "exampleUser",
    email: "user@example.com",
  }
};

// Define your secret key
const secretKey = crypto.randomBytes(64).toString('hex');

// Sign the token
const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

// Set the token in environment variable
dotenv.config({ path: '.env' }); 
fs.appendFileSync('.env', `\nJWT_FIXED_TOKEN=${token}`);

console.log("Token generated and set in environment variable:", token);
