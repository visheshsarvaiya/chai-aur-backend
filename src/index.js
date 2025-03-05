import express from "express"
import {app} from './app.js'
import dotenv from "dotenv"
import connectDB from "./db/index.js" // ✅ Corrected import

dotenv.config(); // ✅ Ensure `.env` file exists

connectDB()

.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(` Server is running at port: ${process.env.PORT}`);
    })
})

.catch((err)=> {
    console.log("MONGO db connection failed !!",err )
})