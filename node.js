//Varun Ravi Kumar
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const crypto = require('crypto');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const config = {
    user: 'sql3680058',
    password: 'r713z9gGLf',
    host: 'sql3.freemysqlhosting.net',
    database: 'sql3680058',
    port: 3306
};

const secretKey = 'your-secret-key';

function createJWT(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${encodedPayload}`).digest('base64');
    return `${header}.${encodedPayload}.${signature}`;
}

function verifyJWT(token, secret) {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64');
    return signature === expectedSignature;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LoginPage.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
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
    
    console.log(req.body);

    const { account_id, password, role_name, hometown, gender, dob } = req.body;

    const insertQuery = `
        INSERT INTO user_accounts (account_id, password, role_name, hometown, gender, dob)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const queryValues = [account_id, password, role_name, hometown, gender, dob];

    connection.query(insertQuery, queryValues, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error: ' + err.message);
            connection.end();
        } else {
            res.redirect('http://localhost:8000/');
            connection.end();
        }
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `
        SELECT password FROM user_accounts WHERE email = ?
    `;

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error: ' + err.message);
            return;
        }

        if (results.length > 0) {
            const storedPassword = results[0].password;
            const isMatch = password === storedPassword;

            if (isMatch) {
                const token = createJWT({ email }, secretKey);
                const redirectUrl = `http://localhost:8000/protected-route?token=${encodeURIComponent(token)}`;
                res.redirect(redirectUrl);
            } else {
                res.status(401).send('Authentication failed');
            }
        } else {
            res.redirect('http://localhost:8000/');
        }
    });
});

app.get('/protected-route', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public2', 'index.html'));
});

function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    if (!verifyJWT(token, secretKey)) {
        return res.status(401).send('Unauthorized');
    }

    const query = `
        SELECT * FROM user_accounts WHERE token = ?
    `;

    connection.query(query, [token], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Server error');
            return;
        }

        if (results.length === 0) {
            return res.status(401).send('Unauthorized');
        }

        next();
    });
}

app.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    try {
        await sql.connect(config);
        const updateDeleteTokenQuery = `
                    UPDATE [dbo].[mock_Accounts]
                    SET token = NULL where token = @token
                    `;
        const request = new sql.Request();
        request.input('token', sql.VarChar, token);
        const result = await request.query(updateDeleteTokenQuery);

        // After deleting the token from the database, respond to the client
        res.status(200).send('Logged out');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


const server = app.listen(8000, function () {
    console.log('Server is running on port 8000');
});
