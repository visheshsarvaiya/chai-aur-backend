class ApiError extends Error{  //api error ke liye
    constructor(
        statusCode,
        message= " Something went wrong ",  // error pata chal jati hai
        error=[],
        stack=""
    ) {   //override kar rahe hai

      super(message)
      this.statusCode=statusCode
      this.data=null
      this.message=message
      this.success=false;
      this.errors=errors

   if(stack){
    this.stack=stack
   }
   else{
    Error.captureStackTrace(this,this.constructor)
   }
    }
}