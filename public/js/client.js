const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const grpName = document.getElementById('group-name');
const userList = document.getElementById('users');
const buttons=document.querySelectorAll('.tag-buttons button');
const loginBtn=document.getElementById('login-btn');
const btn =document.querySelector('btn');
const loggedUser=document.getElementById("username");
const chatBoardUser=document.getElementById("chatBoard");
const activeUser=document.getElementById("activeUser");

var checkSum=0;

  var groupName=location.search.slice(1);
     const socket = io();
     socket.on("userConnected",({checkSum,username})=>{
      if(username && !groupName){
        loginBtn.innerText="Logout";
        loggedUser.innerText=username;
      
      }
  
    //  checkUsername(username);
      buttons.forEach((button)=>{
        button.addEventListener('click',(e)=>{
          e.preventDefault();
        location.href=`chatBoard.html?${button.innerText}`
              });  })

        if (groupName){
         // Join chatroom
        socket.emit('joinGroup', { checkSum,username,groupName});
 
 
  // Get room and users
  socket.on('groupUsers', ({ groupName, users }) => {
    displayGroupName(groupName);
    displayUsers(users);
    });
  socket.on("loadMessages",(msgs)=>{
       displayGroupMessages(msgs);
  })
  
  // Message from server
  socket.on('message',(message) => {
    
    displayMessage(message);
   // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  
  // Message submit
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    // Get message text
    const msg = e.target.elements.msg.value;
    // Emit message to server
    socket.emit('chatMessage', {checkSum,msg});
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });
  // Output message to DOM
function displayMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

    div.innerHTML = `<p class="meta">${message.name} <span>${message.time}</span></p>
    <p class="text">
      ${message.text}
    </p>`;


  document.querySelector('.chat-messages').appendChild(div);
}
function displayGroupMessages(messages){
  messages.map(msg=>displayMessage(msg));
}
// Add room name to DOM
function displayGroupName(groupName) {
  grpName.innerText=groupName +"   "+"chats...."
}

// Add users to DOM
function displayUsers(users) {
  activeUser.innerText=`${username}`;
  userList.innerHTML = `
    ${users.map(user => `<li class="onlinee"><span ></span>${user["name"]}</li>`).join('')}
  `;
}
} 
 })