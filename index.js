// JavaScript source code for the webpage
//index.js
const exp = require('express');//Calls the express application
const User = require('./user');//calls User.js which has a User class with password and username
const path = require('path');//requires a path
const bodyParser = require('body-parser');//calls a parser
const appli = exp();
const port = 3000;
const users = [];
appli.use(exp.static('public'));
appli.use(bodyParser.json());//allows for parsing of json
appli.use(bodyParser.urlencoded({ extended: true }));

appli.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));//returns the index.html that is inside the 'public directory'
});

appli.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));//returns the login.html that is inside the 'public' directory
});
appli.post('/login', (req, res) => {//POST request for login
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);//checks the username
    if (user && user.password === password) {//checks the password
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome ${username}</title>
            </head>
            <body style="background-color:powderblue;">
                <h1>Welcome ${username}</h1>
                <img src="/download.png" alt="happy face">
                <br></br>
            </body>
            </html>
        `);//returns an html head and body that has a welcome message and a happy face.
    } else {
        res.send("Try again");
    }
})
appli.get('/register', (req, res) => {//returns the register.html file that is inside the 'public' directory
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
appli.post('/register', (req, res) => {//POST request for registration
    const { username, password } = req.body;
    if (users.some(user => user.username === username)) {//checks if username is already taken
        return res.send('Username taken');
    }
    const newuser = new User(username, password);//creates new user
    users.push(newuser);//adds new user to array of users.
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background-color:red;">
            <h1>Successfully registered</h1>
            <img src="/360_F_489394725_Oox6jg48u2K0FSk4RlPCzqkU7Qvu2BSu.jpg" alt="Thumbs up">
        </body>
        </html>`);//returns html head and body with a message and a thumbs up image.
});

appli.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});