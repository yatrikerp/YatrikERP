package stepDefinition;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class LoginSteps {
    WebDriver driver = null;

    @Given("browser is open")
    public void browser_is_open() {
        System.out.println("Inside step - Browser is open");
        driver = new ChromeDriver();
        driver.manage().window().maximize();
    }

    @And("user is on login page")
    public void user_is_on_login_page() {
        driver.get("http://localhost:5173/login");
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> ((String)((org.openqa.selenium.JavascriptExecutor)d)
                        .executeScript("return document.readyState")).equals("complete"));
    }

    @When("user enters username and password")
    public void user_enters_username_and_password() {
        WebElement emailInput = findFirstPresent(
                By.id("email"),
                By.name("email"),
                By.cssSelector("input[type='email']"),
                By.xpath("//input[@placeholder='Email' or @placeholder='E-mail' or contains(@aria-label,'email')]")
        );
        emailInput.clear();
        emailInput.sendKeys("admin@yatrik.com");

        WebElement passwordInput = findFirstPresent(
                By.id("password"),
                By.name("password"),
                By.cssSelector("input[type='password']"),
                By.xpath("//input[@placeholder='Password' or contains(@aria-label,'password')]")
        );
        passwordInput.clear();
        passwordInput.sendKeys("admin123");
    }

    @And("user clicks on login")
    public void user_clicks_on_login() {
        WebElement loginBtn = findFirstPresent(
                By.id("loginBtn"),
                By.cssSelector("button[type='submit']"),
                By.xpath("//button[normalize-space()='Login' or normalize-space()='Sign In' or normalize-space()='Log in']"),
                By.xpath("//*[@role='button' and (text()='Login' or text()='Sign In' or text()='Log in')]")
        );
        loginBtn.click();
    }

    @Then("user is navigated to the home page")
    public void user_is_navigated_to_the_home_page() throws InterruptedException {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.or(
                        ExpectedConditions.urlContains("dashboard"),
                        ExpectedConditions.presenceOfElementLocated(By.xpath("//*[contains(text(),'Dashboard') or contains(text(),'Welcome')]"))
                ));
        System.out.println("Navigating to the home page...");
        System.out.println("Test Passed: User is on the homepage.");
        driver.quit();
    }

    private WebElement findFirstPresent(By... locators) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        for (By locator : locators) {
            try {
                return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            } catch (Exception ignored) {
            }
        }
        throw new org.openqa.selenium.NoSuchElementException("None of the provided locators matched any element");
    }
}


