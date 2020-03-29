/******** Global Variables ********/

const socket = io();
let fullBoard;
let boardSize = 3;

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
    },
    {
        name: 'Princess Peach',
        cellImg: './assets/images/Princess_Peach_SMP.png'
    }
];

let gameOver = false;

let clientPlayer = {
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
    leaveGameHandler();
};

// Start game after both clients have selected a player
const gameStart = () => {
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

// Function to handle display of elements in the DOM
const showHideElement = (element, display) => {
    document.getElementById(element).style.display = display
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
    clientPlayer.room = document.getElementById('roomName').value.trim();
    socket.emit('joinRoom', clientPlayer.room);
};

// Apply click listener for creating room
const createRoomHandler = () => {
    document.getElementById('roomBtn').addEventListener('click', createRoom);
};

// Join Room Functionality
const joinRoom = (e) => {
    clientPlayer.room = e.target.innerText
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
    showHideElement(currentScreen, 'none');
    showHideElement(destinationScreen, 'flex');
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
    showHideElement('gameStartModal','none');

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

// Check for Cat's Game
const catsGame = () => {
    if(!gameOver) {
        fullBoard
            .reduce((acc, val) => acc.concat(val), [])
            .filter(cellValue => cellValue === 0).length === 0 ? showCatsGame() : null;
    }
};

// Check for Win by Row Completion
const checkRow = (player) => {
    fullBoard
        .map(row => row
            .filter(cell => cell === player.id)
        )
        .forEach(row => {
            if(row.length === boardSize) {
                showWin(player.character);
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
                showWin(player.character);
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
    catsGame();
};

// Win Animation
const winAnimation = () => {
    document.querySelector('.gameWinner').children[0].style.opacity = '1';
    document.querySelector('.gameWinner').children[2].style.top = '0';
    window.requestAnimationFrame(winAnimation);
};

// Apply Win Animation
const showWin = (character) => {
    showHideElement('gameOverModal','flex');
    document.getElementById('gameOverModal').innerHTML = `<div class="gameWinner"><p>${character.name} Has Won!!!</p><br><img src="${character.cellImg}" alt="${character.name}" /> </div>`;
    window.requestAnimationFrame(winAnimation);
    gameOver = true;
    resetGame();
};

const showCatsGame = () => {
    showHideElement('gameOverModal','flex');
    document.getElementById('gameOverModal').innerHTML = `<div class="gameWinner"><p>Cat's Game...</p><br><img src="${characters[2].cellImg}" alt="${characters[2].name}" /> </div>`;
    window.requestAnimationFrame(winAnimation);
    gameOver = true;
    resetGame();
};

// Reset the game board and show player selection screen.
// Remove disabled attribute from opposing player
// Emit the reset to the opposing player to see if they've selected a new player yet.
// If they have then their selected player will once again be disabled
const gameOverModalClick = () => {
    document.getElementById('gameBoard').innerHTML = '';
    showHideElement('gameOverModal','none');
    showHideElement('gameStartModal', 'flex');
    gameOver = false;
    // Fail check to make sure isTurn has been set to false before new game has been initiated.
    if(clientPlayer.isTurn) clientPlayer.isTurn = false;
    Array
        .from(document.getElementsByName('player'))
        .forEach(player => {
            player.checked = false;
            player
                .getAttribute('disabled') === 'disabled' ? player.removeAttribute('disabled') : null;
        });
    socket.emit('initiateReset', clientPlayer.room);
};

// Reset Players and set Click listener on the game over modal
const resetGame = () => {
    clientPlayer = {
        ...clientPlayer,
        id: null,
        isTurn: false,
        gameStarted: false,
        character: null
    };
    opponentPlayer.id = null;
    document
        .getElementById('gameOverModal')
        .addEventListener('click', gameOverModalClick);
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

const leaveGame = () => {
    socket.emit('leavingGame', {room: clientPlayer.room})
};

const leaveGameHandler = () => {
    document.getElementById('leaveRoomLink').addEventListener('click', leaveGame);
};

