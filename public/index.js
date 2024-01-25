// JavaScript source code for the webpage
//index.js
const exp = require('express');
const User = require('./user');
const appli = exp();
const path = require('path');
const port = 3000;
const users = [];
appli.use(exp.static('public'));

appli.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

appli.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
appli.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && user.passwrod === password) {
        res.send("Welcome ${username}");
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