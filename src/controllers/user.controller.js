import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


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
    console.log("email:",req.body);

    if(

        [fullName,email,username,password].some((field) =>  // validation-not empty
            field?.trim()==="")
    )
    {
        throw new ApiError(400,"All fields are required ")
    }

    const existedUser=await User.findOne({
        $or:[{username}, {email}]
  
    })

    
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }


    const avatarLocalPath =req.files?.avatar[0]?.path;   
    let coverImageLocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalpath = req.files.coverImage[0].path
    }
    
    
    
    
    
    //check for image check for avatar
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

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
        username : username.toLowerCase()
    })
    

    //// reomve password and refresh token field from response
    const createUser =await User.findById(user._id).select ("-password -refreshToken")
    
    // check from user creation  
    if(!createUser){
        throw new ApiError(500,"something went wrong whie registering the user ")
    }
       // return res  
   return res.status(201).json(
    new ApiResponse(200,createUser,"User registered successfully")
   )



}) 


//login 

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body   // step1
    //console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username and email is required")
    }
    
    if (!password) {
        throw new ApiError(400, "Password is required");
    }


    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({        //find user 
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)   //password check 

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  // pass word and refreshtoken nahi chahiye 

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=> {
   const {oldPassword, newPassword}=req.body


   const user=await User.findById(req.user?._id)
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
   }

   user.password=newPassword
   await user.save({validateBeforeSave :false})
   
   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser =asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")  // current user lene ke liye 
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email} =req.body

    if (!(fullName||email)){
        throw new ApiError(400,"All fields are required")
    }
    
    const user =User.findByIdAndUpdate(   //  change kar rahe hai 
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})




 export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,     //export
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

 }