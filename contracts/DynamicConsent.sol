pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicConsent is Ownable {

    
    struct Consent {
        uint256 grantedAt;
        uint256 revokedAt; // if 0 then active
    }

    mapping(address => mapping(uint256 => Consent)) consents;

    event AccessRequested(address indexed participant, uint256 indexed requesterID);
    event ConsentGranted(address indexed participant, uint256 indexed requesterID);
    event ConsentRevoked(address indexed participant, uint256 indexed requesterID);

    constructor(address admin) Ownable(admin) {}

        //only the admin can submit requests on behalf on institutions
        //mapping from requestID to institution is stored off-chain
    

    function requestAccess(address participant, uint256 requesterID) external  onlyOwner  {
        //Only the admin can requestAccess by proxy for institutions
        emit AccessRequested(participant, requesterID);
    }

    function grantConsent(uint256 requesterID) external {
        consents[msg.sender][requesterID] = Consent(block.timestamp, 0);
        emit ConsentGranted(msg.sender, requesterID);
    }

    function revokeConsent(uint256 requesterID) external {
        // Any participant can revoke their own consent

        Consent storage c = consents[msg.sender][requesterID];
        //We are mutating the record of the consents so we use storage
        require(c.grantedAt != 0, "Consent never assigned");

        c.revokedAt = block.timestamp;
        emit ConsentRevoked(msg.sender, requesterID);
    }

    function hasConsent(address participant, uint256 requesterID) external view returns (bool) {
        return consents[participant][requesterID].revokedAt == 0 && consents[participant][requesterID].grantedAt != 0;
    }

}