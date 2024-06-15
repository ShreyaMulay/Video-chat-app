

const express = require('express')

const app = express()

const socket = require('socket.io')



const server = app.listen(3000,()=>{
    console.log("server is running on 3000 port")
})
// http://127.0.0.1:3000/
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))


app.set('view engine','ejs')
app.set('views','./views')


app.use(express.static('public'))


const userRoute = require('./routes/userRoute')
app.use('/',userRoute)



//socket.io is working with signaling server
var io = socket(server)
io.on("connection",function(socket){
    console.log("User connected",socket.id)
    socket.on("join",function(roomName){
        var rooms = io.sockets.adapter.rooms

        var room = rooms.get(roomName)

        if(room == undefined){
            socket.join(roomName)
            console.log("room created ")

            socket.emit("created")
        }
        else if(room.size == 1){
            socket.join(roomName)
            console.log("room joined ")
            socket.emit("joined")

        }
        else{
            console.log("Room is fulled ")
            socket.emit("full")

        }
        console.log("room",room)


    })

    // creating signing server
    // after receing call send ready evebt
    // who has joined
    socket.on("ready",function(roomName){
        console.log("Inside ready")
        socket.broadcast.to(roomName).emit("ready")

    })
    
    // ice candidated
    // send info 
    socket.on("candidate",function(candidate,roomName){
        console.log("candidate",candidate);
        socket.broadcast.to(roomName).emit("candidate",candidate)

    })

    // offer create
    // encreypted information
    socket.on("offer",function(offer,roomName){
        console.log("offer",offer);
        socket.broadcast.to(roomName).emit("offer",offer)
    })

    //created answer
    socket.on("answer",function(answer,roomName){
        console.log("answer",answer);
        socket.broadcast.to(roomName).emit("answer",answer)
    })

    //leave room

    socket.on("leave",function(roomName){
        console.log("leave",roomName);
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit('leave');
    })



})

