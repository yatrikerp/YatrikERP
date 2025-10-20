package stepDefinition;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class BookingSteps {
    WebDriver driver = null;
    private WebDriverWait wait;

    @Given("booking browser is open")
    public void booking_browser_is_open() {
        System.out.println("Inside step - Booking browser is open");
        driver = new ChromeDriver();
        driver.manage().window().maximize();
        wait = new WebDriverWait(driver, Duration.ofSeconds(12));
    }

    @And("user is on booking page")
    public void user_is_on_booking_page() {
        driver.get("http://localhost:5173/");
        wait.until(d -> ((String)((JavascriptExecutor)d).executeScript("return document.readyState")).equals("complete"));
    }

    @When("user searches a trip")
    public void user_searches_a_trip() throws InterruptedException {
        findFirstPresent(
                By.id("from"),
                By.name("from"),
                By.cssSelector("input[placeholder*='From'], input[name*='from']")
        ).sendKeys("Kochi");

        findFirstPresent(
                By.id("to"),
                By.name("to"),
                By.cssSelector("input[placeholder*='To'], input[name*='to']")
        ).sendKeys("Trivandrum");

        try {
            findFirstPresent(
                    By.id("date"),
                    By.name("date"),
                    By.cssSelector("input[type='date']")
            ).sendKeys("2025-10-20");
        } catch (Exception ignored) {}

        findFirstClickable(
                By.id("searchBtn"),
                By.xpath("//button[contains(.,'Search') or contains(.,'Find') or contains(.,'Search Buses')]")
        ).click();
    }

    @And("user selects a seat")
    public void user_selects_a_seat() throws InterruptedException {
        findFirstClickable(
                By.id("seat-1A"),
                By.cssSelector("[data-seat='1A'], .seat.available")
        ).click();
        findFirstClickable(
                By.id("proceedBtn"),
                By.xpath("//button[contains(.,'Proceed') or contains(.,'Continue') or contains(.,'Next')]")
        ).click();
    }

    @And("user proceeds to payment")
    public void user_proceeds_to_payment() throws InterruptedException {
        findFirstClickable(
                By.id("continueToPay"),
                By.xpath("//button[contains(.,'Pay') or contains(.,'Continue to Pay') or contains(.,'Checkout')]")
        ).click();
    }

    @And("user completes payment")
    public void user_completes_payment() throws InterruptedException {
        findFirstClickable(
                By.id("payNowTest"),
                By.xpath("//button[contains(.,'Simulate Payment') or contains(.,'Pay Now') or contains(.,'Complete Payment') or contains(.,'Success')]")
        ).click();
    }

    @Then("QR is generated for the booking")
    public void qr_is_generated_for_the_booking() throws InterruptedException {
        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(By.cssSelector("img[alt*='QR'], canvas.qr, .qr-code")),
                ExpectedConditions.presenceOfElementLocated(By.xpath("//*[contains(text(),'QR') or contains(text(),'Ticket Confirmed') or contains(text(),'Booking Confirmed')]"))
        ));
        System.out.println("QR generated successfully.");
        driver.quit();
    }

    private WebElement findFirstPresent(By... locators) {
        for (By locator : locators) {
            try {
                return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            } catch (Exception ignored) {}
        }
        throw new org.openqa.selenium.NoSuchElementException("No matching element found for provided locators");
    }

    private WebElement findFirstClickable(By... locators) {
        for (By locator : locators) {
            try {
                return wait.until(ExpectedConditions.elementToBeClickable(locator));
            } catch (Exception ignored) {}
        }
        throw new org.openqa.selenium.NoSuchElementException("No clickable element found for provided locators");
    }
}


