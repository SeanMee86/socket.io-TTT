const socket = io();
let fullBoard;

const clientPlayer = {
    id: null,
    isTurn: false
};

const opponentPlayer = {
    id: null
};

window.onload = function() {
    selectPlayerHandler();
};

const gameStart = () => {
    buildGameBoard(3);
    cellClickHandler();
    if(clientPlayer.id === 1) clientPlayer.isTurn = true;
};

// Initial Build of Tic Tac Toe Board in DOM

const buildGameBoard = (boardSize) => {
    const boardRows = new Array(boardSize);

    fullBoard = [...boardRows]
        .map(_ => [...boardRows]
            .map(_ => 0));

    fullBoard.forEach((row, rowInd) => {
        row.forEach((cell, cellInd) => {
            document.getElementById('gameBoard')
                .innerHTML += `<div col='${cellInd+1}' row="${rowInd+1}" class="gameCell"> </div>`
        })
    })
};

// Select Player functionality

const selectPlayer = () => {
    // Create Variable For Selected Player
    const playerSelected = Array
        .from(document.getElementsByName('player'))
        .filter(player => player.checked)[0];

    // Player ID = Value of Selected Player Radio Button
    clientPlayer.id = parseInt(playerSelected.value);

    // Remove Select Player Modal
    document.getElementById('charSelectModal').style.display = 'none';

    // Emit Player Selection to Server
    socket.emit('playerSelectionToServer', clientPlayer);

    // If Opponent has Selected Player Start Game
    if(opponentPlayer.id !== null) {
        gameStart();
    }
};

// Apply Click Listener for Player Selection
const selectPlayerHandler = () => {
    document.getElementById('charSelectBtn')
        .addEventListener('click', selectPlayer);
};

// Cell Clicked Functionality
const cellClicked = (e) => {
    // Only Allow click if it is Player's Turn
    if(clientPlayer.isTurn) {

        // Find Cell by Col and Row Attribute's Applied in BuildGameBoard Function
        const row = e.target.getAttribute('row') - 1;
        const col = e.target.getAttribute('col') - 1;

        // Set Cell = to Player ID
        fullBoard[row][col] = clientPlayer.id;

        // Send Updated Board to Server
        socket.emit('updateBoard', fullBoard);

        // Disallow Players Turn Until Opponent Has Had Their Turn
        clientPlayer.isTurn = false
    }else{
        alert('Its not your turn')
    }
};

// Apply Cell Click Functionality
const cellClickHandler = () => {
    Array.from(document.getElementsByClassName('gameCell'))
        .forEach(cell => {
            cell.addEventListener('click', cellClicked);
        })
};

// Rebuild Board On Update From Server
const rebuildBoard = () => {
    // Remove Old Board
    document.getElementById('gameBoard').innerHTML = '';

    // Loop Through Updated Board and Place Players According to Array Ref Received From Server
    fullBoard.forEach((row, rowInd) => {
        row.forEach((cell, cellInd) => {
            document.getElementById('gameBoard')
                .innerHTML += `<div col='${cellInd+1}' row="${rowInd+1}" class="gameCell">${cell === 1 ? 'X' : cell === 2 ? 'O' : ''}</div>`
        })
    });

    // Reapply Click Functionality
    cellClickHandler()
};

/************ Handlers for Server Events *************/

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
    fullBoard = board;

    // Rebuild the Board with our New Global Board Array
    rebuildBoard();
});

// Change Player Event is Only Emitted to the Player who DID NOT Trigger the Update Board Event To Server
socket.on('changePlayer', _ => {
    // Set Our Clients Turn to True
    clientPlayer.isTurn = true;
});