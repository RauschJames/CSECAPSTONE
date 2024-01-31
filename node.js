const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

/*
function createJWT(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${encodedPayload}`).digest('base64');

    // Replace '+' with '@', '/' with '_', and remove '='
    const urlSafeHeader = header.replace(/\+/g, '').replace(/\//g, '').replace(/=+$/, '');
    const urlSafePayload = encodedPayload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const urlSafeSignature = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `${urlSafeHeader}.${urlSafePayload}.${urlSafeSignature}`;
}


function verifyJWT(token, secret) {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64');
    return signature === expectedSignature;
}
*/

function createJWT(payload, secretKey) {
    return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
}



function verifyJWT(token, secretKey) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
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
    const { account_id, password } = req.body;

    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            res.status(500).send('Server error: ' + err.message);
            return;
        }
        console.log('Connected to the MySQL database.');

        const query = `
            SELECT password FROM user_accounts WHERE account_id = ?
        `;

        connection.query(query, [account_id], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Server error: ' + err.message);
                connection.end();
                return;
            }

            if (results.length > 0) {
                const storedPassword = results[0].password;
                //const storedAcctID = results[0].account_id;
                const isMatch = password === storedPassword;

                if (isMatch) {
                    // Create JWT
                    const token = createJWT({ account_id }, secretKey);
                    //const token = generateRandom22DigitNumber();
                    console.log('Token before SQL insert: '+token);
                    const updateTokenQuery = `
                        UPDATE user_accounts
                        SET token = ?
                        WHERE account_id = ?
                    `;
                    
                    connection.query(updateTokenQuery, [token, account_id], (err, updateResults) => {
                        console.log('AFTER SQL INSERT');
                        if (err) {
                            console.error(err);
                            res.status(500).send('Server error: ' + err.message);
                            connection.end();
                            return;
                        }
                        
                        const redirectUrl = `http://localhost:8000/protected-route?token=${encodeURIComponent(token)}`;
                        console.log(redirectUrl);
                        //const redirectUrl = `http://localhost:8000/protected-route?token=${token}`;
                        res.redirect(redirectUrl);
                    });
                } else {
                    res.status(401).send('Authentication failed');
                    connection.end();
                }
            } else {
                res.redirect('http://localhost:8000/');
                connection.end();
            }
        });
    });
});


app.get('/protected-route', isAuthenticated, (req, res) => {
    console.log("in the protected-route method");
    res.sendFile(path.join(__dirname, 'public2', 'index.html'));
});


function isAuthenticated(req, res, next) {

    const connection = mysql.createConnection(config);

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err);
            process.exit(1); // Exit the app if database connection is critical
        } else {
            console.log('Connected to the MySQL database.');
        }
    });
    
    const token = req.query.token;

    if (!token) {
        return res.status(401).send('Unauthorized from here');
    }

    const result = verifyJWT(token, secretKey);
    if (result.valid) {
        console.log('Token is valid:', result.decoded);
        
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

    } else {
        console.log('Invalid token:', result.error);
        return res.status(401).send('Unauthorized')
    }
    

    
}




/*
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
*/


const server = app.listen(8000, function () {
    console.log('Server is running on port 8000');
});
