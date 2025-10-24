Feature: Booking workflow
  Scenario: Booking trip, selecting seat, paying, and generating QR
    Given booking browser is open
    And user is on booking page
    When user searches a trip
    And user selects a seat
    And user proceeds to payment
    And user completes payment
    Then QR is generated for the booking






