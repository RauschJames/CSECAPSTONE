//Varun Ravi Kumar
const express = require('express');
const mysql = require('mysql');
const path = require('path'); 
const app = express();
const session = require('express-session');
const mailer = require('./mailNotifier');
var nodemailer = require('nodemailer');

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store'); 
    next();
});

const config = {
    user: 'sql3680058',
    password: 'r713z9gGLf',
    host: 'sql3.freemysqlhosting.net',
    database: 'sql3680058',
    port: 3306
};

var imap = {
    user: "alexrotteveel476@gmail.com",
    password: "jlncjvlbdjszjzjg",
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    markSeen: false,
    tlsOptions: { rejectUnauthorized: false }
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LoginPage.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

app.get('/ServiceContext', (req, res) => {
    req.session.bucket_name = req.query.bucket_name;
    req.session.bucket_owner_id = req.query.bucket_owner_id;
    req.session.bucket_owner_role = req.query.bucket_owner_role;
    res.sendFile(path.join(__dirname, 'ServiceContext.html'));
});

app.get('/getBucketData', (req, res) => {
    res.json(req.session);
});

app.post('/submit-form', (req, res) => {

    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            process.exit(1);
        } else {
            console.log('Connected to the MySQL database.');
        }
    });
    
    const { account_id, company_email, password, passwordAgain, role } = req.body;

    if(password !== passwordAgain) {
        connection.end((err) => {
            if (err) {
              console.error('Error closing the connection: ', err);
            } else {
              console.log('Connection closed successfully.');
            }
        });
        res.redirect('/register');
    }
    
    else {
        const insertQuery = `
            INSERT INTO user_accounts (account_id, password, role_name, company_email)
            VALUES (?, ?, ?, ?)
            `; 

        const queryValues = [account_id, password, role, company_email];

        connection.query(insertQuery, queryValues, (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Server error: ' + err.message);
            } else {
                res.redirect('/');
            }
        });
    
        connection.end((err) => {
            if (err) {
                console.error('Error closing the connection: ', err);
            } else {
                console.log('Connection closed successfully.');
            }   
        });
    }
});

app.post('/login', async (req, res) => {
    
    const { account_id, password } = req.body;

    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            process.exit(1);
        } else {
            console.log('Connected to the MySQL database.');
        }
    });

    const query = `
        SELECT password, role_name
        FROM user_accounts
        WHERE account_id = ?
    `;

    connection.query(query, [account_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error: ' + err.message);
            return;
        }
        else {
            if(results.length === 1) {
                const storedPassword = results[0].password;
                const isMatch = password === storedPassword; 

                if(isMatch) {
                    req.session.account_id = account_id;
                    req.session.role_name = results[0].role_name;
                    res.redirect('/index');
                }
                else {
                    res.redirect('/');
                }
            }
            else {
                res.redirect('/');
            }
        } 
    });
        
    connection.end((err) => {
        if (err) {
            console.error('Error closing the connection: ', err);
        } else {
            console.log('Connection closed successfully.');
        }
    });
});

app.get('/index', (req, res) => {
    if(req.session.account_id && req.session.role_name){
        res.sendFile(path.join(__dirname, 'public2', 'indexRedesigned.html'));
        //res.sendFile(path.join(__dirname, 'public2', 'index.html'));
        
    }
    else{
        res.redirect('/');    
    }   
});

app.get('/getStarted', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'getStarted.html'));
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Server error');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/getSessionData', (req, res) => {
    
    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            process.exit(1); 
        } else {
            console.log('Connected to the MySQL database.');
        }
    });
    
    const query = `
        SELECT account_id, role_name
        FROM   user_accounts
        ORDER BY account_id = ? DESC;
    `;

    connection.query(query, [req.session.account_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error: ' + err.message);
            return;
        }
        else {
            req.session.results = results;
            res.json(req.session);
        } 
    });
        
    connection.end((err) => {
        if (err) {
            console.error('Error closing the connection: ', err);
        } else {
            console.log('Connection closed successfully.');
        }
    });
});

app.get('/mailer', (req, res) => {
    
    function timeoutFunction() {
        
        console.log("Timeout function executed!");
    }

    const timeoutDuration = 5 * 60 * 1000;
    setTimeout(timeoutFunction, timeoutDuration);
    
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'alexrotteveel476@gmail.com',
          pass: 'jlncjvlbdjszjzjg'
        }
    });
    
    var mailOptions = {
        from: 'alexrotteveel476@gmail.com',
        to: 'alexanderrotteveel@yahoo.com',
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });

    mailer(imap).on('mail',function(mail, isValid){
        
        
    }).start("capstone");

    console.log("in /mailer");
});

app.listen(8000, function () {
    console.log('Server is running on port 8000');
});
