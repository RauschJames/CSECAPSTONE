//Varun Ravi Kumar
const express = require('express');
const mysql = require('mysql');
const path = require('path'); 
const app = express();
const session = require('express-session');

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

const config = {
    user: 'sql3680058',
    password: 'r713z9gGLf',
    host: 'sql3.freemysqlhosting.net',
    database: 'sql3680058',
    port: 3306
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
            process.exit(1); // Exit the app if database connection is critical
        } else {
            console.log('Connected to the MySQL database.');
        }
    });
    
    const { account_id, dob, hometown, gender, password, passwordAgain, role } = req.body;

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
            INSERT INTO user_accounts (account_id, password, role_name, hometown, gender, dob)
            VALUES (?, ?, ?, ?, ?, ?)
            `; 

        const queryValues = [account_id, password, role, hometown, gender, dob];

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
            process.exit(1); // Exit the app if database connection is critical
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
    res.sendFile(path.join(__dirname, 'public2', 'index.html'));
});

app.post('/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          res.status(500).send('Server error');
        } else {
          res.redirect('/login'); 
        }
    });
});

app.get('/getSessionData', (req, res) => {
    res.json(req.session);
});

app.listen(8000, function () {
    console.log('Server is running on port 8000');
});
