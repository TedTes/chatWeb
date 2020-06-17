const {getDB}=require('./db.js')
const {userSchema,groupMessageSchema}=require('./schema.js')
// const mongoose=require('mongoose');
const users = [];
const db=getDB();
const mongoose=db;

//login user
async function loginUser(user){
  let result;
 let id=getCheckSum(user.name,user.password)
  var User=mongoose.model('user',userSchema);
  const res=await User.find({id},"-_id name password");
    try{
      if(res.length!==0)
    return (res[0].name===user.name&&res[0].password===user.password)? true:false
 }
 catch(e){console.log(e);}
}
//register user to the database
async function registerUser(newuser){
 const checkSum=getCheckSum(newuser.name,newuser.password)
   newuser.id=checkSum;
  var User=mongoose.model('user',userSchema);
  const userData=newuser
  const user=new User(userData)
      await user.save(function(err){
          if(err)console.log(err);
          else {
            console.log("Successfully Saved");
            return true;
          } 
        });
}
 // inserting joined user to database 
async function joinUser(id,groupName){
  var User=mongoose.model('user',userSchema);
     const res = await User.updateOne({ id }, {groupName:groupName,status:"online"});
  }
async function insertMessage(message){
 const Messages=mongoose.model('message',groupMessageSchema)
    const msg=new Messages(message)
    try{
      await msg.save(function(err){
        console.log("successfully inserted")
      });
    }
   catch(e){
     console.log(e)
   }
     }


// Get current user
async function getCurrentUser(id) {
 
  const User=mongoose.model('user',userSchema);
   const res=await User.find({id},"-_id id name groupName")
    if(res.length!==0) return res[0];
   
}
// User leaves chat
async function userLeave(id) {
  const User=mongoose.model('user',userSchema);
  const index =await  User.updateOne({id},{status:"offline"} );

}

// Get room users
async function getGroupUsers(groupName) {
 const User=mongoose.model('user',userSchema);
 const res=await User.find({groupName,status:"online"}, '-_id name');
       return res;
}

async function loadMessages(groupName){
    const Messages=mongoose.model('message',groupMessageSchema)
    try{
  const res=await Messages.find({groupName},'-_id name text time');
      if(res) return res;
  }
  catch(err) {console.log(err);}
  }

function getCheckSum(value1,value2){
  let checkSum=0;
  const acct=value1.concat(value2);
  for(var i=0;i<acct.length;i++)
  checkSum=checkSum+acct.charCodeAt(i)
return checkSum;
}

module.exports = {
  getCurrentUser,
  userLeave,
  getGroupUsers,
  joinUser,
  insertMessage,
  loadMessages,
  registerUser,
  loginUser
}
