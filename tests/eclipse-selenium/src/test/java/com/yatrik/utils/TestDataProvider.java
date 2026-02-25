package com.yatrik.utils;

import org.testng.annotations.DataProvider;

public class TestDataProvider {

    @DataProvider(name = "depotUserData")
    public Object[][] getDepotUserData() {
        return new Object[][] {
            {"depot@yatrik.com", "depot123"}
        };
    }

    @DataProvider(name = "stateUserData")
    public Object[][] getStateUserData() {
        return new Object[][] {
            {"state@yatrik.com", "state123"}
        };
    }

    @DataProvider(name = "vendorUserData")
    public Object[][] getVendorUserData() {
        return new Object[][] {
            {"vendor@yatrik.com", "vendor123"}
        };
    }

    @DataProvider(name = "passengerUserData")
    public Object[][] getPassengerUserData() {
        return new Object[][] {
            {"passenger@yatrik.com", "passenger123"}
        };
    }

    @DataProvider(name = "invalidLoginData")
    public Object[][] getInvalidLoginData() {
        return new Object[][] {
            {"", "password123"},
            {"test@test.com", ""},
            {"invalid@email.com", "wrongpass"},
            {"notanemail", "password"},
            {"", ""}
        };
    }
}
