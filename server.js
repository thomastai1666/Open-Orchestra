var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var port = process.env.PORT || 3000;
var usercount = 0;

//Static resources get routed to public folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    socket.broadcast.emit('chat message', msg);
    console.log('message: ' + msg);
  });
  usercount += 1;
  console.log("Users: " + usercount);
  io.emit('counter', usercount);

  socket.on('users', function(){
    console.log(usercount);
    console.log("Users: " + usercount);
    io.emit('counter', usercount);
  });

  socket.on('disconnect', function(){
    usercount -= 1;
    console.log(usercount);
    console.log("Users: " + usercount);
    io.emit('counter', usercount);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});