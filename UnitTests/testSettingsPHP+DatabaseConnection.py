import pytest
import requests
import pymssql

# Constants
FORM_URL = "https://main.dzyoo64rgfqyj.amplifyapp.com/updateSettings.php"  # URL where the form submits
DB_SERVER = 'mocked-db.cailplyo9oeg.us-east-1.rds.amazonaws.com'
DB_USER = 'admin'
DB_PASSWORD = 'admin123'
DB_NAME = 'mockAccounts'

def test_form_submission():
    """Test form submission to the PHP script."""
    data = {
        'hometown': 'TestTown',
        'gender': 'male',
        'password': 'TestPass123',
        'username': 'TestUser'
    }
    response = requests.post(FORM_URL, data=data)
    assert response.status_code == 200
    assert "Record updated successfully" in response.text

def test_database_update():
    """Test if the database is updated correctly."""
    conn = pymssql.connect(DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT hometown, gender, password FROM mock_Accounts WHERE username = 'TestUser'")
    result = cursor.fetchone()
    conn.close()

    assert result is not None
    assert result[0] == 'TestTown'
    assert result[1] == 'male'


@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    """Setup and teardown for the tests."""
    # Setup the test environment, if necessary
    conn = pymssql.connect(DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME)
    cursor = conn.cursor()
    conn.close()

    yield

    # Teardown the test environment
    conn = pymssql.connect(DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME)
    cursor = conn.cursor()
    conn.commit()
    conn.close()
