
const {getDB}=require('./db.js')
const db=getDB();
const mongoose=db;
const userSchema=new mongoose.Schema({
    id:String,
    name:String,
    password:String,
    groupName:String,
    email:String,
    status:String
    })
    
 const groupMessageSchema=new mongoose.Schema({
      groupName:String,
      name:String,
      text:String,
      time:String
    })
    

    module.exports={userSchema,groupMessageSchema}