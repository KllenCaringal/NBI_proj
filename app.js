const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./routes/router');
const app = express();


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

const PORT = 8090;
app.listen(PORT, () => {
    console.log(`Server initialized on http://localhost:${PORT}`);
    console.log('Views Directory:', app.get('views'));
});
