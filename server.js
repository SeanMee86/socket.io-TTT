const express = require('express');
const app = express();
const socketio = require('socket.io');

app.use(express.static('static'));

const PORT = process.env.PORT || 5000;
const expressServer = app.listen(PORT, console.log(`Listening on port: ${PORT}`));
const io = socketio(expressServer);

module.exports = {
    app,
    io
};

