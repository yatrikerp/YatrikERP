// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BusTicket is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Ticket {
        string bookingId;
        string routeId;
        string passengerName;
        uint256 fare;
        uint256 issueDate;
        uint256 travelDate;
        bool isUsed;
        bool isRefunded;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(string => uint256) public bookingToToken;

    event TicketIssued(
        uint256 indexed tokenId,
        string bookingId,
        address passenger,
        uint256 fare
    );
    
    event TicketUsed(uint256 indexed tokenId, uint256 usedDate);
    event TicketRefunded(uint256 indexed tokenId, uint256 refundDate);

    constructor() ERC721("Kerala Bus Ticket", "KBT") {}

    function issueTicket(
        address passenger,
        string memory bookingId,
        string memory routeId,
        string memory passengerName,
        uint256 fare,
        uint256 travelDate
    ) public onlyOwner returns (uint256) {
        require(bookingToToken[bookingId] == 0, "Ticket already issued");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(passenger, newTokenId);

        tickets[newTokenId] = Ticket({
            bookingId: bookingId,
            routeId: routeId,
            passengerName: passengerName,
            fare: fare,
            issueDate: block.timestamp,
            travelDate: travelDate,
            isUsed: false,
            isRefunded: false
        });

        bookingToToken[bookingId] = newTokenId;

        emit TicketIssued(newTokenId, bookingId, passenger, fare);

        return newTokenId;
    }

    function markTicketUsed(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Ticket does not exist");
        require(!tickets[tokenId].isUsed, "Ticket already used");
        require(!tickets[tokenId].isRefunded, "Ticket was refunded");

        tickets[tokenId].isUsed = true;
        emit TicketUsed(tokenId, block.timestamp);
    }

    function refundTicket(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Ticket does not exist");
        require(!tickets[tokenId].isUsed, "Cannot refund used ticket");
        require(!tickets[tokenId].isRefunded, "Ticket already refunded");

        tickets[tokenId].isRefunded = true;
        emit TicketRefunded(tokenId, block.timestamp);
    }

    function getTicket(uint256 tokenId) public view returns (Ticket memory) {
        require(_exists(tokenId), "Ticket does not exist");
        return tickets[tokenId];
    }

    function getTicketByBooking(string memory bookingId) public view returns (Ticket memory) {
        uint256 tokenId = bookingToToken[bookingId];
        require(tokenId != 0, "Booking not found");
        return tickets[tokenId];
    }

    function verifyTicket(uint256 tokenId) public view returns (bool isValid) {
        if (!_exists(tokenId)) return false;
        Ticket memory ticket = tickets[tokenId];
        return !ticket.isUsed && !ticket.isRefunded;
    }
}
