@RoleLogin
Feature: YATRIK ERP Role-Based Login and Logout Tests
  As a user of YATRIK ERP system
  I want to verify that different roles can login and logout successfully
  So that the authentication system works correctly for all user types

  Background:
    Given the YATRIK ERP application is running on "http://localhost:5173/login"

  @AdminLogin @HighPriority
  Scenario: Admin User Login and Logout Flow
    Given I am on the login page
    When I enter admin credentials
      | email              | password  |
      | admin@yatrik.com   | admin123  |
    And I click the login button
    Then I should be redirected to the admin dashboard
    And I should see the admin dashboard elements
    When I click the logout button
    Then I should be redirected back to the login page
    And I should see the login form elements

  @DepotLogin @HighPriority
  Scenario: Depot User Login and Logout Flow
    Given I am on the login page
    When I enter depot credentials
      | email                    | password    |
      | depot-plk@yatrik.com     | Akhil@123   |
    And I click the login button
    Then I should be redirected to the depot dashboard
    And I should see the depot dashboard elements
    When I click the logout button
    Then I should be redirected back to the login page
    And I should see the login form elements

  @ConductorLogin @MediumPriority
  Scenario: Conductor User Login and Logout Flow
    Given I am on the login page
    When I enter conductor credentials
      | email              | password    |
      | joel@gmail.com     | Yatrik123   |
    And I click the login button
    Then I should be redirected to the conductor dashboard
    And I should see the conductor dashboard elements
    When I click the logout button
    Then I should be redirected back to the login page
    And I should see the login form elements

  @DriverLogin @MediumPriority
  Scenario: Driver User Login and Logout Flow
    Given I am on the login page
    When I enter driver credentials
      | email              | password    |
      | rejith@gmail.com   | Akhil@123   |
    And I click the login button
    Then I should be redirected to the driver dashboard
    And I should see the driver dashboard elements
    When I click the logout button
    Then I should be redirected back to the login page
    And I should see the login form elements

  @PassengerLogin @LowPriority
  Scenario: Passenger User Login and Logout Flow
    Given I am on the login page
    When I enter passenger credentials
      | email                              | password    |
      | lijithmk2026@mca.ajce.in          | Akhil@123   |
    And I click the login button
    Then I should be redirected to the passenger dashboard
    And I should see the passenger dashboard elements
    When I click the logout button
    Then I should be redirected back to the login page
    And I should see the login form elements

  @InvalidCredentials @NegativeTest
  Scenario: Invalid Login Credentials Test
    Given I am on the login page
    When I enter invalid credentials
      | email              | password    |
      | invalid@test.com   | wrongpass   |
    And I click the login button
    Then I should see an error message
    And I should remain on the login page

  @EmptyCredentials @NegativeTest
  Scenario: Empty Login Credentials Test
    Given I am on the login page
    When I leave credentials empty
    And I click the login button
    Then I should see validation error messages
    And I should remain on the login page
