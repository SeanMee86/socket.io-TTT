const { io } = require('../server');

const activeRooms = [];

const removeRoom = (room) => {
    if(!io.sockets.adapter.rooms[room]){
        activeRooms.splice(activeRooms.indexOf(room), 1);
        io.emit('updateRooms', activeRooms);
    }
};

const onlyAllowOneRoom = (roomToJoin, socket) => {
    const currentRooms = Object.keys(socket.rooms);
    if(currentRooms.length > 1) {
        currentRooms.forEach(room => {
            room !== socket.id && room !== roomToJoin ? socket.leave(room, err => err) : null;
        })
    }
};

const scrubName = (roomName) => {
    return roomName.trim().toLowerCase()
};

io.on('connection', (socket) => {
    let roomName;
    socket.emit('updateRooms', activeRooms);

    socket.on('joinRoom', roomToJoin => {
        // Check to see if current socket already belongs to a room and remove them if they do.
        roomToJoin = scrubName(roomToJoin);
        // onlyAllowOneRoom(roomToJoin, socket);
        if(socket.adapter.rooms[roomToJoin].length < 2 ){
            socket.join(roomToJoin);
            socket.emit('roomJoined');
            roomName = roomToJoin;
            if(socket.adapter.rooms[roomToJoin].length === 2){
                socket.to(roomToJoin).emit('getOpponent');
            }
        }else{
            socket.emit('roomIsFull');
        }
    });

    socket.on('createRoom', roomToJoin => {
        roomToJoin = scrubName(roomToJoin);
        // onlyAllowOneRoom(roomToJoin, socket);
        if(!socket.adapter.rooms[roomToJoin]){
            socket.join(roomToJoin);
            socket.emit('roomJoined');
            roomName = roomToJoin;
            if(!activeRooms.some(room => room === roomToJoin)) {
                activeRooms.push(roomToJoin);
                io.emit('updateRooms', activeRooms);
            }
        }else{
            socket.emit('roomAlreadyExists');
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

    socket.on('leavingGame', () => {
        const rooms = Object.keys(socket.rooms);
        rooms.forEach((room) => {
            if(room !== socket.id) {
                socket.leave(room, (err) => {
                    socket.emit('leftGame');
                    removeRoom(room);
                    return err;
                });
            }
        })
    });

    socket.on('disconnect', () => {
        if(roomName !== undefined) {
            socket.broadcast.to(roomName).emit('playerDisconnect');
            removeRoom(roomName);
        }
    });
});

module.exports = io;