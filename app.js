const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./routes/router');

const app = express();
const server = http.createServer(app); 
const io = new Server(server);


app.use(session({
    secret: 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);


app.use((req, res, next) => {
    if (req.session.user || req.path === '/login') {
        next();
    } else {
        res.redirect('/login');
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        console.log('Received message:', msg); 
        io.emit('chat message', msg);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server on port 8090
const PORT = 8090;
server.listen(PORT, () => { // Start the HTTP server instead of the app
    console.log(`Server initialized on http://localhost:${PORT}`);
    console.log('Views Directory:', app.get('views'));
});
