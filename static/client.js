const socket = io();
let fullBoard;
let boardSize = 3;
let waitForPlayer;

const characters = [
    {
        name: 'Mario',
        img: './assets/images/220px-MarioNSMBUDeluxe.png'
    },
    {
        name: 'Luigi',
        img: './assets/images/696px-Luigi_New_Super_Mario_Bros_U_Deluxe.png'
    }
];

const clientPlayer = {
    id: null,
    isTurn: false,
    room: null,
    gameStarted: false,
    character: null
};

const opponentPlayer = {
    id: null
};

window.onload = function() {
    selectPlayerHandler();
    createRoomHandler();
};

const gameStart = async () => {
    if(!clientPlayer.gameStarted) {
        await clearInterval(waitForPlayer);
        document
            .getElementById('gameBoard')
            .innerHTML = '';
        buildGameBoard(boardSize);
        cellClickHandler();
        if (clientPlayer.id === 1) clientPlayer.isTurn = true;
        clientPlayer.gameStarted = true
    }
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

// Create Room Functionality

const createRoom = () => {
    clientPlayer.room = document.getElementById('roomName').value;
    socket.emit('joinRoom', clientPlayer.room);
};

// Apply click listener for creating room

const createRoomHandler = () => {
    document.getElementById('roomBtn').addEventListener('click', createRoom);
};

const joinRoom = (e) => {
    clientPlayer.room = e.target.innerText;
    socket.emit('joinRoom', clientPlayer.room);
};

const joinRoomHandler = () => {
    Array
        .from(document.getElementById('roomList').children)
        .forEach(li => {
            li.addEventListener('click', joinRoom);
        })
};

const assignCharacterToPlayer = (playerId) => {
    // Assign character to Player
    switch(playerId) {
        case 1:
            clientPlayer.character = characters[0];
            break;
        case 2:
            clientPlayer.character = characters[1];
            break;
        default:
            clientPlayer.character = null;
    }
};

// Select Player functionality

const selectPlayer = () => {
    // Create Variable For Selected Player
    const playerSelected = Array
        .from(document.getElementsByName('player'))
        .filter(player => player.checked)[0];

    // Player ID = Value of Selected Player Radio Button
    clientPlayer.id = parseInt(playerSelected.value);

    assignCharacterToPlayer(clientPlayer.id);

    // Remove Select Player Modal
    document.getElementById('gameStartModal').style.display = 'none';

    // Emit Player Selection to Server
    socket.emit('playerSelectionToServer', clientPlayer);

    document.getElementById('gameRoomName').innerText = clientPlayer.room;

    // If Opponent has Selected Player Start Game
    if(!opponentPlayer.id) {
        let waitForPlayerCounter = 0;
        document
            .getElementById('gameBoard')
            .innerHTML = `<div class="wait-for-player">Waiting For Player</div>`;

        waitForPlayer = setInterval(() => {
            document
                .querySelector('.wait-for-player')
                .innerText += '.';
            waitForPlayerCounter++;
            if(waitForPlayerCounter > 4) {
                document
                    .querySelector('.wait-for-player')
                    .innerText = `Waiting For Player`;
                waitForPlayerCounter = 0;
            }
        }, 700);
    }
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
        if(fullBoard[row][col] === 0) {
            fullBoard[row][col] = clientPlayer.id;
            // Send Updated Board to Server
            socket.emit('updateBoard', {fullBoard, clientPlayer});

            // Disallow Players Turn Until Opponent Has Had Their Turn
            clientPlayer.isTurn = false
        }
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

/********* Win Conditions *********/

// Check for Win by Row Completion
const checkRow = (player) => {
    fullBoard
        .map(row => row
            .filter(cell => cell === player.id)
        )
        .forEach(row => {
            if(row.length === boardSize) {
                showWin(player.character)
            }
        });
};

// Check for Win by Column Completion
const checkCol = (player) => {
    fullBoard
        .map((row, ind) => row
            .map((_, i) => {
                return fullBoard[i][ind]
            }).filter(cell => cell === player.id)
        )
        .forEach(col => {
            if(col.length === boardSize) {
                showWin(player.character)
            }
        });
};

// Check for Win by Diagonal Completion Left to Right
const checkDiag1 = (player) => {
    if(fullBoard.reduce((acc, val, i) => {
        return acc.concat(val[i]);
    },[]).filter(cell => cell === player.id).length === boardSize){
        showWin(player.character)
    }
};

// Check for Win by Diagonal Completion Right to Left
const checkDiag2 = (player) => {
    if(fullBoard.reduce((acc, val, i) => {
        return acc.concat(val[fullBoard.length-(1+i)]);
    },[]).filter(cell => cell === player.id).length === boardSize){
        showWin(player.character)
    }
};

// Check To See if The Player Has Won
const checkWinCondition = (player) => {
    checkRow(player);
    checkCol(player);
    checkDiag1(player);
    checkDiag2(player);
};

const winAnimation = () => {
    document.querySelector('.gameWinner').children[0].style.opacity = '1';
    document.querySelector('.gameWinner').children[2].style.top = '0';
    window.requestAnimationFrame(winAnimation);
};

const showWin = (character) => {
    const gameOverScreen = document.getElementById('gameOverModal');
    gameOverScreen.style.display = 'flex';
    gameOverScreen.innerHTML = `<div class="gameWinner"><p>${character.name} Has Won!!!</p><br><img src="${character.img}" alt="${character.name}" /> </div>`;
    window.requestAnimationFrame(winAnimation);
};

// Rebuild Board On Update From Server
const rebuildBoard = (lastPlayer) => {
    // Remove Old Board
    document.getElementById('gameBoard').innerHTML = '';

    // Loop Through Updated Board and Place Players According to Array Ref Received From Server
    fullBoard.forEach((row, rowInd) => {
        row.forEach((cell, cellInd) => {
            document.getElementById('gameBoard')
                .innerHTML += `<div 
                    col='${cellInd + 1}' 
                    row="${rowInd + 1}" 
                    style="background: url(${cell === 1 ? characters[0].img : cell === 2 ? characters[1].img : ''}) center/50% no-repeat;" 
                    class="gameCell"></div>`
        })
    });

    // Reapply Click Functionality
    cellClickHandler();

    // Check To See if the Last Move Won the Game
    checkWinCondition(lastPlayer);
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
    fullBoard = board.fullBoard;

    // Rebuild the Board with our New Global Board Array
    rebuildBoard(board.player);
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
    document.getElementById('roomSelect').style.display = 'none';
    document.getElementById('charSelect').style.display = 'flex';
});

socket.on('roomIsFull', () => {
    document
        .querySelector('.roomFullMessage')
        .innerHTML = '<span class="error-message">We are sorry but the room you have chosen is full, please enter a new room.</span>'
});

socket.on('updateRooms', rooms => {
    document.getElementById('roomList').innerHTML = '';
    rooms.forEach(room => {
        document.getElementById('roomList').innerHTML += `<li>${room}</li>`
    });
    joinRoomHandler();
});