const path = require('path');
require('dotenv').config({path:'./config.env'});
const moment = require('moment');
const http = require('http');
const bodyParser=require('body-parser');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./models/messages');
const {connectToDb,getDB}=require('./models/db.js')
const { loginUser,loadMessages,joinUser,getCurrentUser,userLeave,getGroupUsers,insertMessage,registerUser} = require('./models/users');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport =require('passport');
const session=require('express-session');
const findOrCreate=require('mongoose-findorcreate');
const {userSchema}=require('./models/schema.js')



const app = express();
const server = http.createServer(app);
const io = socketio(server);


const botName = 'ChatWeb Bot';
var username;
var checkSum;
var userFromOauth=false;
var user={}
var connectOnce=false;

const mongoose=getDB();

userSchema.plugin(findOrCreate);
var activeAccountUser=mongoose.model('user',userSchema)
app.use(bodyParser.urlencoded({extended:false}))
//access public folder
app.set('trust proxy', 1) // trust first proxy
// app.use(session({
//   secret: 'thisissecret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
// app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
// =================================================
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // callbackURL: "http://localhost:3000/auth/google/callback"
  callbackURL:"https://chattappln.herokuapp.com/auth/google/callback"
},
function(accessToken, refreshToken, profile, cb) {
  activeAccountUser.findOrCreate({ password: profile.id,name:profile.name.givenName}, function (err, user) {
    return cb(err, user);
  });
}
));
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_KEY,
  clientSecret: process.env.LINKEDIN_SECRET,
  // callbackURL: "http://localhost:3000/auth/linkedin/callback",
  callbackURL: "https://chattappln.herokuapp.com/auth/linkedin/callback",
  scope: ['r_emailaddress','r_liteprofile'],
 }, function(accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  // process.nextTick(function () {
    activeAccountUser.findOrCreate({ password: profile.id,name:profile.name.givenName}, function (err, user) {
      return done(null, user);
    });
  
  // });
}));
// ========================================================
 // Immediate calling function to connect to the database
 (function(){
  connectToDb();
  })();
app.post('/login',async(req,res)=>{
  username=req.body.username;
  password=req.body.password;
  res.redirect('/login')
})
app.get('/login',async(req,res)=>{
 checkSum=0;
  user={
    name:username,
    password:password
  }
  if(userFromOauth){
    registerUser(user);
  }

//  username=req.body.username;
username=username;
password=password;

  // var password=req.body.password;
 const acct=username.concat(password);
  for(var i=0;i<acct.length;i++)
checkSum=checkSum+acct.charCodeAt(i)
if(await loginUser(user)){
res.sendFile(path.join(__dirname+'/public/index.html'))
if(!connectOnce){
  io.on('connection', async(socket) => {
    socket.emit("userConnected",{checkSum,username})
    socket.on('joinGroup', async({checkSum,username,groupName}) => {
      groupNam=groupName;
      const user={username,groupName}
      const n = await joinUser(checkSum,groupName);
        const res=await loadMessages(groupName);
     socket.join(user.groupName);
      socket.emit('message',formatMessage(botName, 'Welcome to ChatWeb!')); 
      // Welcome current user
       socket.emit("loadMessages",(res))
     // Broadcast when a user connects 
      socket.broadcast.to(user.groupName).emit('message',formatMessage(botName, `${user.username} has joined the chat`)
        );
      // Send users and group info
      io.to(user.groupName).emit('groupUsers', {
        groupName: user.groupName,
        users: await getGroupUsers(user.groupName)
      });
    });
  
    // Listen for chatMessage
    socket.on('chatMessage', async({checkSum,msg}) => {
      
     const curruser = await getCurrentUser(checkSum);
    const message=formatMessage(curruser.name,msg,curruser.groupName)
      const res=insertMessage(message)
      io.to(curruser.groupName).emit('message', formatMessage(curruser.name, msg));
    });
  
    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(checkSum);
  
      if (user) {
        io.to(user.groupName).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // // Send users and room info
        // io.to(user.groupName).emit('groupUsers', {
        //   groupName: user.groupName,
        //   users: getGroupUsers(user.groupName)
        // });
      }
    });
  });
  connectOnce=true;
}

}

else
res.sendFile(path.join(__dirname,'/public/login.html'))
});
app.get('/logout',(req,res)=>{
  const user=userLeave(checkSum);
  res.sendFile(path.join(__dirname,'/public/login.html'))
})
app.post('/register', (req,res)=>{
  user={
    name:req.body.name,
    email:req.body.email,
    password:req.body.password
  }
  if(registerUser(user))
  res.sendFile(path.join(__dirname,'/public/login.html'))
  else res.sendStatus(500)
})
app.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }));

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    // successRedirect: '/login',
    failureRedirect: '/'
  }),function(req,res){
   username=req.user.name;
   password=req.user.password;
   userFromOauth=true;
   res.redirect('/login')
  });
  app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req,res){
    // console.log("from auth callback");
    // console.log(req.user)
 
    username=req.user.name;
    password=req.user.password;
    userFromOauth=true;

    res.redirect('/login')
  });
  // ============================================

// triggered when client connected;


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
