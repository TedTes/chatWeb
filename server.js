const path = require('path');
const moment = require('moment');
const http = require('http');
const bodyParser=require('body-parser');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./models/messages');
const {connectToDb}=require('./models/db.js')
const { loginUser,loadMessages,joinUser,getCurrentUser,userLeave,getGroupUsers,insertMessage,registerUser} = require('./models/users');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport =require('passport');
const session=require('express-session');
const ejs=require('ejs');
const botName = 'ChatWeb Bot';
const app = express();
const server = http.createServer(app);
const io = socketio(server);


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
// =================================================
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log("from google")
  // console.log(profile)
  // User.findOrCreate({ googleId: profile.id }, function (err, user) {
  //   return cb(err, user);
  // });
}
));
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_KEY,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: "http://localhost:3000/auth/linkedin/callback",
  scope: ['r_emailaddress','r_liteprofile'],
 }, function(accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  process.nextTick(function () {
    console.log("from linkedin")
    console.log(profile)
    return done(null, profile);
  });
}));
// ========================================================
 // Immediate calling function to connect to the database
 (function(){
  connectToDb();
  })();

app.post('/login',async(req,res)=>{
  console.log("hello")
  var checkSum=0;
  user={
    name:req.body.username,
    password:req.body.password
  }
  var username=req.body.username;
  var password=req.body.password;
  const acct=username.concat(password);
  for(var i=0;i<acct.length;i++)
checkSum=checkSum+acct.charCodeAt(i)
if(await loginUser(user)){
  res.sendFile(path.join(__dirname+'/public/index.html'))
  io.on('connection', async(socket) => {
    socket.emit("userConnected",{checkSum,username})
  
    socket.on('joinGroup', async({checkSum,username,groupName}) => {
      const user={username,groupName}
      // id=checkSum;
     const res=await loadMessages(groupName);
     const n = await joinUser(checkSum,groupName);
     socket.join(user.groupName,()=>{
        // console.log(socket.groupName)
     });
      // Welcome current user
      socket.emit('message',formatMessage(botName, 'Welcome to ChatWeb!'));
      socket.emit("loadMessages",(res))
     // Broadcast when a user connects 
      socket.broadcast.to(user.groupName).emit('message',formatMessage(botName, `${user.username} has joined the chat`)
        );
      // Send users and room info
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
}

else
res.sendFile(path.join(__dirname,'/public/login.html'))
});
app.get('/logout',(req,res)=>{
  res.sendFile(path.join(__dirname,'/public/index.html'))
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
  passport.authenticate('linkedin', { state: 'SOME STATE'  }),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
  app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("from server")
    console.log(req.user);
    // Successful authentication, redirect home.
    res.redirect('/');
  });
  // ============================================

// triggered when client connected;


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
