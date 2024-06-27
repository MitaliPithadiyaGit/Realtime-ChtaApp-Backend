import mongoose from "mongoose";

const Connection = async (url) => {
    const URL = `${url}`;
    try {
      await mongoose.connect(URL);
      console.log("Database Connected Successfully");
    } catch (error) {
      console.error("Error While connecting to the Database:", error);
      process.exit(1);
    }
  };


export default Connection;