const express = require('express');
const app = express();
const socketio = require('socket.io');

app.use(express.static('static'));

const PORT = process.env.PORT || 5000;
const expressServer = app.listen(PORT, console.log(`Listening on port: ${PORT}`));
const io = socketio(expressServer);

const activeRooms = [];

io.on('connection', (socket) => {
    socket.emit('updateRooms', activeRooms);
    socket.on('joinRoom', roomToJoin => {
        if(!socket.adapter.rooms[roomToJoin] || socket.adapter.rooms[roomToJoin].length < 2 ){
            socket.join(roomToJoin);
            socket.emit('roomJoined');
            if(socket.adapter.rooms[roomToJoin].length === 2){
                socket.to(roomToJoin).emit('getOpponent');
            }else{
                if(!activeRooms.some(room => room === roomToJoin)) {
                    activeRooms.push(roomToJoin);
                    io.emit('updateRooms', activeRooms);
                }
            }
        }else{
            socket.emit('roomIsFull');
        }
    });

    socket.on('playerSelectionToServer', player => {
        if(io.sockets.adapter.sids[socket.id][player.room] !== undefined) {
            socket.to(player.room).emit('opponentHasSelected', {
                player,
                message: 'Opponent Has Selected'
            })
        }
    });

    socket.on('updateBoard', board => {
        if(io.sockets.adapter.sids[socket.id][board.clientPlayer.room] !== undefined) {
            io.in(board.clientPlayer.room).emit('sendUpdate', {
                fullBoard: board.fullBoard,
                player: board.clientPlayer
            });
            socket.to(board.clientPlayer.room).emit('changePlayer');
        }
    });

    socket.on('initiateReset', currentRoom => {
        socket.to(currentRoom).emit('getOpponent');
    });

    socket.on('disconnect', () => {
        io.emit('playerDisconnect')
    });
});