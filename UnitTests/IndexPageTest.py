
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class ServerManagementTests(unittest.TestCase):
    def setUp(self):
     
        self.driver = webdriver.Chrome("chromedriver.exe") #assumed to be ran from folder
        self.driver.get("https://main.dzyoo64rgfqyj.amplifyapp.com") 

    def test_add_server(self):
        driver = self.driver
        add_server_button = driver.find_element(By.ID, "addServerButton")
        add_server_button.click()

        server_name_input = driver.find_element(By.ID, "serverNameInput")
        server_name_input.send_keys("testserver")
        submit_button = driver.find_element(By.ID, "submitServerName")
        submit_button.click()

        # Wait for the server list to update
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'testserver')]"))
        )

        # Verify that the server is added
        self.assertTrue(driver.find_element(By.XPATH, "//div[contains(text(), 'testserver')]").is_displayed())

    def test_delete_server(self):
         driver = self.driver

        # Add a server first
        add_server_button = driver.find_element(By.ID, "addServerButton")
        add_server_button.click()

        server_name_input = driver.find_element(By.ID, "serverNameInput")
        server_name_input.send_keys("testserver")
        submit_button = driver.find_element(By.ID, "submitServerName")
        submit_button.click()

        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'testserver')]"))
        )

        # Delete the server
        delete_button = driver.find_element(By.XPATH, "//button[@id='deleteBucket']")
        delete_button.click()

        WebDriverWait(driver, 10).until_not(
            EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'testserver')]"))
        )

        # Verify that the server is deleted
        self.assertIsNone(driver.find_elements(By.XPATH, "//div[contains(text(), 'testserver')]"))

    def test_show_server_info(self):
         driver = self.driver

        # Click on a server instance (assuming at least one server exists)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "service-instance"))
        )
        server_instance = driver.find_element(By.CLASS_NAME, "service-instance")
        server_instance.click()

        # Verify popup is displayed
        popup = driver.find_element(By.ID, "popup")
        self.assertTrue(popup.is_displayed())

    def test_dropdown_functionality(self):
         driver = self.driver

        # Click on the toolbar to show the dropdown
        toolbar = driver.find_element(By.ID, "toolbar")
        toolbar.click()

        # Verify the presence of 'Settings' and 'Logout' options
        settings_link = driver.find_element(By.XPATH, "//a[@href='settings.html']")
        logout_link = driver.find_element(By.XPATH, "//a[@href='logout.html']")
        self.assertTrue(settings_link.is_displayed())
        self.assertTrue(logout_link.is_displayed())

    def test_region_selection(self):
        driver = self.driver

        # Select a region from the dropdown
        region_dropdown = driver.find_element(By.ID, "regionDropdown")
        region_dropdown.click()
        region_option = driver.find_element(By.XPATH, "//option[@value='eu-west-1']")
        region_option.click()

        WebDriverWait(driver, 10).until(
            # This condition should be updated according to how the server list changes
            EC.presence_of_element_located((By.CLASS_NAME, "service-instance"))
        )


    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
