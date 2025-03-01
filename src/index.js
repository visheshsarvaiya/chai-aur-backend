import express from "express"

import dotenv from "dotenv"
import connectDB from "./db/index.js" // ✅ Corrected import

dotenv.config(); // ✅ Ensure `.env` file exists
const app = express()
connectDB()

.then(()=>{
    app.listen(8000,()=>{
        console.log(` Server is running at port: $ {process.env.PORT}`);
    })
})

.catch((err)=> {
    console.log("MONGO db connection failed !!",err )
})