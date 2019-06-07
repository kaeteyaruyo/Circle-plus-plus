import *  as fs from 'fs';
import {getRangeRandom , getRandomProblem } from './Ramdom';
import * as path from 'path';

const problems = {
    "keys" : ["basic","function","special"],
    "basic" : ["<","==",">","%"],
    "function" : ["isInteger(sqrt(x))","isFib(x)","isInterger(log(x))"],
    "special" : ["x-2x+1","x+2x+1"]
}

function updateProblem(io,room,socket){
    let problem = getRandomProblem(problems);
    io.sockets.in(socket.room).emit('updateProblem', { problem:problem});
}

export {updateProblem}