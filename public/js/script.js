var socket = io();

var videoChatForm = document.getElementById('video-chat-form')
var videoChatRooms = document.getElementById('video-chat-rooms')
var joinBtn = document.getElementById('join')
var roomInput = document.getElementById('roomName')
var userVideo = document.getElementById('user-video')
var peerVideo = document.getElementById('peer-video')
var divBtnGroup = document.getElementById('btn-group')
var muteButton = document.getElementById('muteButton')
var hideVideo = document.getElementById('hideVideo')
var leaveRoomBtn = document.getElementById('leaveRoomBtn')


var muteFlag = false;
var hideVideoFlag = false;


var roomName;

//  navigator.getUserMedia used for chrome support
// navigator.webkitGetUserMedia for firefox
// mozGetUserMedia for mozila
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var creator = false

var rtcPeerConnection;
var userStream;

var iceServers =  {
    iceServers:[
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun1.l.google.com:19302'}
    ]
};
// var iceServers =   {"iceServers":[{"urls":["stun:stun.l.google.com:19302"]},{"urls":["turn:domain.com:8080?transport=udp","turn:domain.com:8080?transport=tcp","turn:domain.com:8080"],"username":"test","credential":"password"}],"lifetimeDuration":"86400s","blockStatus":"NOT_BLOCKED","iceTransportPolicy":"all"}

// var STUN = {
//     'url': 'stun:stun.l.google.com:19302',
// };

// var TURN = {
//     url: 'turn:homeo@turn.bistri.com:80',
//     credential: 'homeo'
// };

// var iceServers = 
// {
//     iceServers: [STUN, TURN]
// };


joinBtn.addEventListener('click',function(){

    if(roomInput.value == ''){
        alert("Please enter room name")
    }
    else{
        roomName = roomInput.value;
        socket.emit("join",roomName)
    }

})

muteButton.addEventListener('click',function(){
    muteFlag = !muteFlag;
    if(muteFlag)
    {
        userStream.getTracks()[0].enabled = false;
        muteButton.textContent = "Unmute";
    }
    else{
        userStream.getTracks()[0].enabled = true;
        muteButton.textContent = "Mute";

    }
})


hideVideo.addEventListener('click',function(){
    hideVideoFlag = !hideVideoFlag;
    if(hideVideoFlag)
    {
        userStream.getTracks()[1].enabled = false;
        hideVideo.textContent = "Show Video";
    }
    else{
        userStream.getTracks()[1].enabled = true;
        hideVideo.textContent = "Hide Video";

    }
})

socket.on('created',function(){
    creator = true
    navigator.getUserMedia(
        {
                audio:true,
                video:true
        },
        function(stream){
            userStream = stream;
            videoChatForm.style.display = 'none'
            divBtnGroup.style.display='flex';
            userVideo.srcObject = stream; // getting video stram from here
            userVideo.onloadedmetadata = function(e){
                userVideo.play()  // now we have stuck video , so here we are showing live video 
            }


        },
        function(){
            alert("u cant access media")

        }
    )


})

socket.on('joined',function(){
    creator = false

    navigator.getUserMedia(
        {
                audio:true,
                video:true
        },
        function(stream){
            userStream = stream;

            videoChatForm.style.display = 'none';
            divBtnGroup.style.display='flex';

            userVideo.srcObject = stream; // getting video stram from here
            userVideo.onloadedmetadata = function(e){
                userVideo.play()  // now we have stuck video , so here we are showing live video 

            }
            socket.emit("ready",roomName)


        },
        function(){
            alert("u cant access media")

        }
    )

    
})


socket.on('full',function(){
    alert("Room is full u cant join ")
    
})
socket.on('ready',function(){
    if(creator){
       rtcPeerConnection = new RTCPeerConnection(iceServers);
       rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
       rtcPeerConnection.ontrack = OnTrackFunction;
       console.log("::userStream.getTracks()",userStream.getTracks());
       rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //for audio track
       rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream); // for video track to other peers
        rtcPeerConnection.createOffer(
            function(offer)
            {
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit('offer',offer,roomName)
            },
            function(error){
                console.log("error");

            }
        )

    }

})


socket.on('candidate',function(candidate){
    var iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);

    
})
socket.on('offer',function(offer){
    if(!creator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0],userStream); //for audio track
        rtcPeerConnection.addTrack(userStream.getTracks()[1],userStream); // for video track to other peers
        rtcPeerConnection.setRemoteDescription(offer);
        
        rtcPeerConnection.createAnswer(
             function(answer)
             {
                 rtcPeerConnection.setLocalDescription(answer);
                 socket.emit('answer',answer,roomName)
             },
             function(error){
                 console.log("error");
 
             }
         )
 
     }
    
})
socket.on('answer',function(answer){
    rtcPeerConnection.setRemoteDescription(answer);
})

//leave room

leaveRoomBtn.addEventListener('click',function(){
    socket.emit('leave',roomName)
   
    videoChatForm.style.display = 'block';
    divBtnGroup.style.display='none';

    if(userVideo.srcObject)
    {
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
    }
    if(peerVideo.srcObject)
    {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();

    }

    if(rtcPeerConnection)
    {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }

})


socket.on("leave",function(){

    creator = true;
    
    if(peerVideo.srcObject)
    {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();

    }

    if(rtcPeerConnection)
    {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }
    
})
function OnIceCandidateFunction(event){
    if(event.candidate){
        socket.emit('candidate',event.candidate,roomName)
    }

}

function OnTrackFunction(event){
    peerVideo.srcObject = event.streams[0]; 
    peerVideo.onloadedmetadata = function(e){
        peerVideo.play() 
    }
}

