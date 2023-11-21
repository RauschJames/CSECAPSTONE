//Varun Ravi Kumar
const express = require('express');
const sql = require('mssql');
const path = require('path'); 
const app = express();
const crypto = require('crypto');


app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));

const config = {
    user: 'admin',
    password: 'admin123',
    server: 'mocked-db.cailplyo9oeg.us-east-1.rds.amazonaws.com', 
    database: 'Accounts',
    port: 1433,
    options: {
        encrypt: true, 
        trustServerCertificate: true 
    }
};


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

const secretKey = 'your-secret-key'; // Use a strong, secret key

function isAuthenticated(req, res, next) {
    const token = req.headers.authorization;
    if (token && verifyJWT(token.split(' ')[1], secretKey)) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LoginPage.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});


app.post('/submit-form', async (req, res) => {
    
    console.log(req.body);

    
    const { username, dob, hometown, gender, password } = req.body;

    try {
        await sql.connect(config);

        const insertQuery = `
            INSERT INTO [dbo].[mock_Accounts] ([username], [DateOfBirth], [Hometown], [Gender], [Password])
            VALUES (@username, @dob, @hometown, @gender, @password)
        `; 

        const request = new sql.Request();
        request.input('username', sql.VarChar, username);
        request.input('dob', sql.Date, dob);
        request.input('hometown', sql.VarChar, hometown);
        request.input('gender', sql.VarChar, gender);
        request.input('password', sql.VarChar, password); 

        await request.query(insertQuery);
        res.redirect('http://localhost:8000/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + err.message);
    } finally {
        await sql.close();
    }
});


app.post('/login', async (req, res) => {
  
    //console.log(req.body);

    
    const { username, password } = req.body;


    try {
        await sql.connect(config);

        const query = `
            SELECT [Password]
            FROM [dbo].[mock_Accounts]
            WHERE [username] = @username
        `;

        const request = new sql.Request();
        request.input('username', sql.VarChar, username);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            const storedPassword = result.recordset[0].Password;
            
            const isMatch = password === storedPassword; 

            if (isMatch) {
                // Create JWT
                const token = createJWT({ username }, secretKey);
                
                await sql.connect(config);
                const updateTokenQuery = `
                    UPDATE [dbo].[mock_Accounts]
                    SET token = @token
                    WHERE username = @username
                    `;

        
                const tokenRequest = new sql.Request();
                tokenRequest.input('username', sql.VarChar, username);
                tokenRequest.input('token', sql.VarChar, token);
                await tokenRequest.query(updateTokenQuery);
                
                const redirectUrl = `http://localhost:8000/protected-route?token=${encodeURIComponent(token)}`;
                //const redirectUrl = `https://main.dzyoo64rgfqyj.amplifyapp.com/protected-route?token=${encodeURIComponent(token)}`;
                
                res.redirect(redirectUrl);
                
                
                //res.redirect('http://localhost:8000/protected-route');
            //if (isMatch) {
                //res.redirect('http://localhost:8000/index');
              //  res.redirect('https://main.dzyoo64rgfqyj.amplifyapp.com/#');
            }else {
                res.status(401).json({ success: false, message: 'Authentication failed' });
            }
        } else {
            res.redirect('http://localhost:8000/');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + err.message);
    } finally {
        await sql.close();
    }
});

async function isAuthenticated(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    if (!verifyJWT(token, secretKey)) {
        return res.status(401).send('Unauthorized');
    }

    // Check if the token is in the database
    try {
        await sql.connect(config);
        const query = `SELECT * FROM mock_Accounts WHERE token = @token`;
        const request = new sql.Request();
        request.input('token', sql.VarChar, token);
        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.status(401).send('Unauthorized');
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

app.get('/protected-route', (req, res) => {
    const token = req.query.token;
    if (token && verifyJWT(token, secretKey)) {
        //res.redirect('https://main.dzyoo64rgfqyj.amplifyapp.com/#');
        res.sendFile(path.join(__dirname, 'public2', 'index.html'));
    } else {
        res.status(401).send('Unauthorized');
    }
});

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
