const express = require('express');
const app = express();
const socketio = require('socket.io');

app.use(express.static('static'));

const PORT = process.env.PORT || 5000;
const expressServer = app.listen(PORT, console.log(`Listening on port: ${PORT}`));
const io = socketio(expressServer);

io.on('connection', (socket) => {
    socket.on('joinRoom', roomToJoin => {
        if(!socket.adapter.rooms[roomToJoin] || socket.adapter.rooms[roomToJoin].length < 2 ){
            socket.join(roomToJoin);
            console.log(socket.adapter.rooms[roomToJoin].length);
            if(socket.adapter.rooms[roomToJoin].length === 2){
                socket.to(roomToJoin).emit('getOpponent');
            }
        }else{
            console.log('Room is full')
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
        if(io.sockets.adapter.sids[socket.id][player.room] !== undefined) {
            io.in(board.clientPlayer.room).emit('sendUpdate', {
                fullBoard: board.fullBoard,
                playerID: board.clientPlayer.id
            });
            socket.to(board.clientPlayer.room).emit('changePlayer');
        }
    });

    socket.on('disconnect', () => {
        io.emit('playerDisconnect')
    });
});