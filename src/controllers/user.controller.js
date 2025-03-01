import {asynchandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/usres.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiRespose} from "../utils/ApiResponse.js";
const registerUser =asyncHandler ( async(req,res)=> {  //register method 
   // get user details from frontend 
   // validation-not empty
   // check if user already exists : username , email
   //check for image check for avatar
   //upload them to cloudinary, avatar
   // create user object-create entry in db
   // reomve password and refresh token field from response
   // check from user creation 
   // return res  



     const {fullName,email,username,password} = req.body           // get user details from fronten
    console.log("email:",email);

    if(

        [fullName,email,username,password].some((field) =>  // validation-not empty
            fields?.trim()==="")
    )
    {
        throw new ApiError(400,"All fields are required ")
    }

    const existedUser=User.findOne({
        $or:[{username}, {email}]

    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }


    const avatarLocalPath =req.files?.avatar[0]?.path;      //check for image check for avatar
    const coverImageLocalpath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {                   
        throw new ApiError(400,"Avatar file is required ")
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath);
   const coverImage= await uploadOnCloudinary (coverImageLocalpath)            //upload them to cloudinary, avatar

   if(!avatar){
    throw new ApiError(400,"Avatar file is required ")

   }

      // create user object-create entry in db
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",
        email,
        password,
        username : username.tLowerCase()
    })
    

    //// reomve password and refresh token field from response
    const createUser =await User.findById(user._id).select ("-password -refreshToken")
    
    // check from user creation  
    if(!createUser){
        throw new ApiError(500,"something went wrong whie registering the user ")
    }
       // return res  
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )



}) 


 export {
    registerUser,
 }