//Varun Ravi Kumar
const express = require('express');
const sql = require('mssql');
const path = require('path'); 
const app = express();


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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'LoginPage.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public2', 'index.html'));
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
        res.status(200).send('Data inserted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + err.message);
    } finally {
        await sql.close();
    }
});

app.post('/login', async (req, res) => {
  
    console.log(req.body);

    
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
                res.redirect('https://main.dzyoo64rgfqyj.amplifyapp.com/#');
            } else {
                res.status(401).json({ success: false, message: 'Authentication failed' });
            }
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error: ' + err.message);
    } finally {
        await sql.close();
    }
});


const server = app.listen(8000, function () {
    console.log('Server is running on port 8000');
});
