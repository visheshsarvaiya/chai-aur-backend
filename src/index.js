import dotenv from "dotenv"
import connectDB from "./db/index.js"; // ✅ Corrected import

dotenv.config(); // ✅ Ensure `.env` file exists

connectDB()

.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(` Server is running at port: $ {process.env.PORT}`);
    })
})

.catch((err)=> {
    console.log("MONGO db connection failed !!",err );
})