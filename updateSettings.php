<?php
    // Database credentials
    $serverName = "mocked-db.cailplyo9oeg.us-east-1.rds.amazonaws.com"; // WE USE A MOCKED INSTANCE THIS WILL BE SALTED AND PREVIOUS CREDS THROWN OUT
    $connectionOptions = array(
        "Database" => "mockAccounts",
        "Uid" => "admin",
        "PWD" => "admin123"
    );

    // Create connection
    $conn = sqlsrv_connect($serverName, $connectionOptions);

    // Check connection
    if ($conn === false) {
        die(print_r(sqlsrv_errors(), true));
    }

    // Get form data
    $hometown = $_POST['hometown'];
    $gender = $_POST['gender'] !== 'other' ? $_POST['gender'] : $_POST['customGender'];
    $password = $_POST['password']; // Remember to hash passwords before storing
    $username = $_POST['username'];

    // Update query
    $sql = "UPDATE users SET hometown=?, gender=?, password=? WHERE username=?";
    $params = array($hometown, $gender, $password, $username);

    // Prepare and execute query
    $stmt = sqlsrv_prepare($conn, $sql, $params);
    if ($stmt) {
        if (sqlsrv_execute($stmt)) {
            echo "Record updated successfully";
        } else {
            echo "Error updating record: ";
            die(print_r(sqlsrv_errors(), true));
        }
    } else {
        die(print_r(sqlsrv_errors(), true));
    }

    // Close connection
    sqlsrv_close($conn);
?>
