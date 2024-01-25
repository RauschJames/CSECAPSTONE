// JavaScript source code for the webpage
//index.js
const exp = require('express');
const User = require('./user');
const path = require('path');
const bodyParser = require('body-parser');
const appli = exp();
const port = 3000;
const users = [];
appli.use(exp.static('public'));
appli.use(bodyParser.json());
appli.use(bodyParser.urlencoded({ extended: true }));

appli.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

appli.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
appli.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome ${username}</title>
            </head>
            <body>
                <h1>Welcome ${username}</h1>
                <img src="/download.png" alt="happy face">
            </body>
            </html>
        `);
    } else {
        res.send("Try again");
    }
})
appli.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
appli.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users.some(user => user.username === username)) {
        return res.send('Username taken');
    }
    const newuser = new User(username, password);
    users.push(newuser);
    res.send('Successfully registered');
});

appli.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});