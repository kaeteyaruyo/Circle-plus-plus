import {updateProblem} from './Problem';
import {updateTimer,createTimer} from './Timer';

// usernames which are currently connected to the chat
let usernames = {};
let gameRoom = {};
// rooms which are currently available in chat
let rooms = ['room1','room2','room3'];

function createIo(io){
    io.sockets.on('connection',  (socket) =>{

        // when the client emits 'adduser', this listens and executes
        socket.on('adduser', (username)=>{
            // store the username in the socket session for this client
            socket.username = username;
            // store the room name in the socket session for this client
            socket.room = 'room1';
            // add the client's username to the global list
            usernames[username] = username;
            // send client to room 1
            socket.join('room1');
            // echo to client they've connected
            socket.emit('updatechat', 'SERVER', 'you have connected to room1');
            // echo to room 1 that a person has connected to their room
            socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
            socket.emit('updaterooms', rooms, 'room1');
        });
    
        // when the client emits 'sendchat', this listens and executes
        socket.on('sendchat',  (data)=> {
            // we tell the client to execute 'updatechat' with 2 parameters
            io.sockets.in(socket.room).emit('updatechat', socket.username, data);
        });
    
        socket.on('switchRoom', (newroom)=>{
            // leave the current room (stored in session)
            socket.leave(socket.room);
            // join new room, received as function parameter
            socket.join(newroom);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
            // sent message to OLD room
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
            // update socket session room title
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
            socket.emit('updaterooms', rooms, newroom);
        });
    
        // when the user disconnects.. perform this
        socket.on('disconnect', ()=>{
            // remove the username from global usernames list
            delete usernames[socket.username];
            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
            socket.leave(socket.room);
        });
        socket.on('startGame',(room)=>{
            if(typeof gameRoom[room] !== 'undefined'){
                socket.room = room;
                socket.join(room);
            }
            else{
                let timer = createTimer();
                gameRoom[room] = {};
                gameRoom[room]["timer"] = timer;
                let timerFun = setInterval(()=>{
                    updateTimer(io,timer,socket);
                },1000);
                let problemFun = setInterval(()=>{
                    updateProblem(io,room,socket);
                },5000);
                gameRoom[room]["timerFun"] = timerFun;
                gameRoom[room]["problemFun"] = problemFun;
                socket.room = room;
                socket.join(room);
            }
        });
        socket.on('closeGame',(room)=>{
            if(typeof gameRoom[room] !== 'undefined'){
                socket.room = "";
                socket.leave(room);
                let timerFun = gameRoom[room]["timerFun"];
                let problemFun = gameRoom[room]["problemFun"];
                clearInterval(timerFun);
                clearInterval(problemFun);
            }
        });
    });
}



export {createIo}