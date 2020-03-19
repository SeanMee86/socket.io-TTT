/******** Global Variables ********/

const socket = io();
let fullBoard;
let boardSize = 3;
let waitForPlayerRef;

const characters = [
    {
        name: 'Mario',
        cellImg: './assets/images/220px-MarioNSMBUDeluxe.png',
        iconImg: './assets/images/Mario.png'
    },
    {
        name: 'Luigi',
        cellImg: './assets/images/696px-Luigi_New_Super_Mario_Bros_U_Deluxe.png',
        iconImg: './assets/images/Masthead_luigi.17345b1513ac044897cfc243542899dce541e8dc.9afde10b.png'
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

/******** End Global Variables ********/

// Initialize Game
window.onload = function() {
    gameInitializer()
};

// Add Function Handlers
const gameInitializer = () => {
    addInitialHandlers();
};


// Holds our initial Function Handlers that must be added before the game has started
const addInitialHandlers = () => {
    selectPlayerHandler();
    createRoomHandler();
    joinOrCreateClickHandler();
    clearRoomFullMessageHandler();
};

// Start game after both clients have selected a player
const gameStart = async () => {
    if(!clientPlayer.gameStarted) {
        document
            .getElementById('gameBoard')
            .innerHTML = '';
        buildGameBoard(boardSize);
        cellClickHandler();
        if (clientPlayer.id === 1) clientPlayer.isTurn = true;
        clientPlayer.gameStarted = true;
        addPlayerIcons();
        Array
            .from(document.getElementsByClassName('playerIndicator'))
            .filter(player => player.getAttribute('player') === '1')[0]
            .style.border = '2px solid yellow';
        Array
            .from(document.getElementsByClassName('playerIndicator'))
            .filter(player => player.getAttribute('player') !== '1')[0]
            .style.border = '2px solid transparent';
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
                .innerHTML += `<div col='${cellInd+1}' row="${rowInd+1}" class="gameCell"></div>`
        })
    })
};

// Add Players Icons to the Player Indicator Boxes
const addPlayerIcons = () => {
    const playerBoxes = Array.from(document.getElementsByClassName('playerIndicator'));
    playerBoxes.forEach(box => {
        switch(box.getAttribute('player')){
            case '1':
                box.style.backgroundImage = `url(${characters[0].iconImg})`;
                box.className += ' playerIndicatorBackground';
                break;
            case '2':
                box.style.backgroundImage = `url(${characters[1].iconImg})`;
                box.className += ' playerIndicatorBackground';
                break;
            default:
                box.style.background = '';
        }
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

// Join Room Functionality
const joinRoom = (e) => {
    clientPlayer.room = e.target.innerText;
    socket.emit('joinRoom', clientPlayer.room);
};

// Loop through list of rooms and add click listener for Join Room Function
const joinRoomHandler = () => {
    Array
        .from(document.getElementById('roomList').children)
        .forEach(li => {
            li.addEventListener('click', joinRoom);
        })
};

// Swap between Join and Create Room Screens
const joinOrCreateRoom = (currentScreen, destinationScreen) => {
    document.getElementById(currentScreen).style.display = 'none';
    document.getElementById(destinationScreen).style.display = 'flex';
};

// Apply click listeners to Upper Right Links
const joinOrCreateClickHandler = () => {
    document
        .getElementById('newRoomLink')
        .addEventListener('click', () => {
            joinOrCreateRoom('existingRooms', 'createRoom')
        });
    document
        .getElementById('createRoomLink')
        .addEventListener('click', () => {
            joinOrCreateRoom('createRoom', 'existingRooms')
        });
};

// Remove Room Full Error Message
const clearRoomFullMessage = () => {
    document.querySelector('.roomFullMessage').innerHTML = '';
    document.querySelector('.roomTakenMessage').innerHTML = '';
};

// Add click listener to screen to clear Room Full Error Message
const clearRoomFullMessageHandler = () => {
    document.getElementById('roomSelect').addEventListener('click', clearRoomFullMessage);
};

// Assign character to player on player selection
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

// Show "Wait for player..." while waiting for opposing player
const waitForPlayer = () => {
    document
        .getElementById('gameBoard')
        .innerHTML = `<div class="wait-for-player">Waiting For Player...<br><div class="loader">Loading...</div></div>`;
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
        waitForPlayer();
    }else{
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

// Win Animation
const winAnimation = () => {
    document.querySelector('.gameWinner').children[0].style.opacity = '1';
    document.querySelector('.gameWinner').children[2].style.top = '0';
    window.requestAnimationFrame(winAnimation);
};

// Apply Win Animation
const showWin = (character) => {
    const gameOverScreen = document.getElementById('gameOverModal');
    gameOverScreen.style.display = 'flex';
    gameOverScreen.innerHTML = `<div class="gameWinner"><p>${character.name} Has Won!!!</p><br><img src="${character.cellImg}" alt="${character.name}" /> </div>`;
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
                    style="background: url(${cell === 1 ? characters[0].cellImg : cell === 2 ? characters[1].cellImg : ''}) center/50% no-repeat;" 
                    class="gameCell"></div>`
        })
    });

    // Reapply Click Functionality
    cellClickHandler();

    // Check To See if the Last Move Won the Game
    checkWinCondition(lastPlayer);
};

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
    console.log(board);
    const playerIcons = Array
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
    document.getElementById('roomSelect').style.display = 'none';
    document.getElementById('charSelect').style.display = 'flex';
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
        document.getElementById('existingRooms').style.display = 'none';
        document.getElementById('createRoom').style.display = 'flex';
    }
    document.getElementById('roomList').innerHTML = '';
    rooms.forEach(room => {
        document.getElementById('roomList').innerHTML += `<li class="link">${room}</li>`
    });
    joinRoomHandler();
});