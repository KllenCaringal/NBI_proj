const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./routes/router');

const app = express();

app.use(session({
    secret: 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use false for local development (true for HTTPS)
}));

// Middleware to make session user data available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to ensure the user is authenticated for protected routes
app.use((req, res, next) => {
    const publicPaths = ['/login', '/register', '/verify'];
    if (req.session.user || publicPaths.includes(req.path)) {
        next();
    } else {
        res.redirect('/login');
    }
});

app.use(express.json());
app.use('/', routes);

const PORT = 8090;
app.listen(PORT, () => {
    console.log(`Server initialized on http://localhost:${PORT}`);
    console.log('Views Directory:', app.get('views'));
});
