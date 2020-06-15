require ('dotenv').config();
const mongoose=require('mongoose');
var db;
 function connectToDb(){
 
mongoose.connect(process.env.DB_PORT,{useNewUrlParser: true})
    

     db=mongoose.connection
    db.on('error',console.error.bind(console,"connection error"))
    db.once('open',function(){
      console.log('we are connected');
    })
}

function getDB(){
   return mongoose;
}

module.exports={getDB,connectToDb}


