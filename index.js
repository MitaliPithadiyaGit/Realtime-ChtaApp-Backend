import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser"
import Connection from "./Database/Db.js";
import Routes from "./Routes/Route.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(bodyParser.json({extend:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use("/",Routes)

const url = process.env.DB_CONNECT;
console.log(url,"url");
Connection(url);

const PORT = process.env.PORT;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});