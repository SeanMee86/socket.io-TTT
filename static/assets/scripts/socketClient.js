/************ Server Event Handlers *************/

// On Opposing Player Selection We Receive an Object Containing that Players ID
socket.on('opponentHasSelected', (data) => {
    // Set Variable Equal to the Radio Button That Contains Opposing Players Character Selection
    const playerToDisable = Array
        .from(document.getElementsByName('player'))
        .filter(player => parseInt(player.value) === data.player.id)[0];

    // Disable and If Checked On Our Players Side Uncheck
    playerToDisable.setAttribute('disabled', 'disabled');
    playerToDisable.checked = false;

    // Set Global Opponent Player Objects ID to ID Received from Opponent Selection Server Event
    opponentPlayer.id = data.player.id;

    // If We Receive the Opponent Players Selection and Our Player has Selected as Well Start Game
    if(clientPlayer.id !== null) {
        gameStart();
    }
});

// Send Update Event from Server Holds the New Board after Our Opponent has Clicked a Cell, Emitted to all Clients
socket.on('sendUpdate', board => {
    // Set Our Global Board Array = to the Updated Board from Server
    fullBoard = board.fullBoard;

    // Rebuild the Board with our New Global Board Array
    rebuildBoard(board.player);
    Array
        .from(document.getElementsByClassName('playerIndicator'))
        .forEach(icon => {
            if(parseInt(icon.getAttribute('player')) === board.player.id){
                icon.style.border = '2px solid transparent';
            }else{
                icon.style.border = '2px solid yellow';
            }
        });
});

// Change Player Event is Only Emitted to the Player who DID NOT Trigger the Update Board Event To Server
socket.on('changePlayer', _ => {
    // Set Our Clients Turn to True
    clientPlayer.isTurn = true;
});

socket.on('getOpponent', () => {
    if(clientPlayer.id !== null) {
        socket.emit('playerSelectionToServer', clientPlayer);
    }
});

socket.on('roomJoined', () => {
    showHideElement('roomSelect', 'none');
    showHideElement('charSelect', 'flex')
});

socket.on('roomIsFull', () => {
    document
        .querySelector('.roomFullMessage')
        .innerHTML = '<span class="error-message">We are sorry but the game you have chosen is full, please enter a new game.</span>';
    document
        .querySelector('.roomTakenMessage')
        .innerHTML = '<span class="error-message">We are sorry but the game you have chosen is full, please enter a new game.</span>'
});

socket.on('updateRooms', rooms => {
    if(rooms.length === 0){
        showHideElement('existingRooms', 'none');
        showHideElement('createRoom', 'flex');
    }
    document.getElementById('roomList').innerHTML = '';
    rooms.forEach(room => {
        document.getElementById('roomList').innerHTML += `<li class="link"><i class="fas fa-chevron-right"></i>${room}</li>`
    });
    joinRoomHandler();
});

socket.on('leftGame', () => {
    showHideElement('charSelect', 'none');
    showHideElement('roomSelect', 'flex');
});

socket.on('playerDisconnect', () => {
    Array
        .from(document.getElementsByName('player'))
        .forEach(player => {
            player.removeAttribute('disabled');
        });
    opponentPlayer.id = null;
});
