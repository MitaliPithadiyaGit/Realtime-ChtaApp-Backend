import mongoose from "mongoose";

const Connection = async(url)=>{
    const URL = `${url}`;
    try{
       await mongoose.connect(URL)
        console.log("Database Connected SuccessFully");
    }
    catch(error){
        console.log("Error Whileconnected to the Database:",error);
    }
}


export default Connection;