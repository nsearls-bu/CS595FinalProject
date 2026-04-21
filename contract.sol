// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedInformedConsent {

    // states of the consent request
    enum ConsentStatus {
        Pending,
        Granted,
        Revoked
    }

    // information about the request
    struct AccessRequest {
        uint256 requestId;
        address participant;
        address requester;
        string requesterName;
        string dataId;
        string purpose;
        ConsentStatus status;
        uint256 requestedAt;
        uint256 updatedAt;
    }

    address public owner;               // contract owner who can update key confiuration
    address public intermediary;        // approved intermediary account thatis allowed to create requests
    uint256 public nextRequestId;       // counter that generates a unique id

    mapping(uint256 => AccessRequest) public requests;
    mapping(address => uint256[]) private participantToRequestIds;

    // logs when approved intermediary account changes
    event IntermediaryUpdated (
        address indexed oldIntermediary,
        address indexed newIntermediary
    );

    // logs when a new access request is created
    event AccessRequested (
        uint256 indexed requestId,
        address indexed participant,
        address indexed requester,
        string requesterName,
        string dataId,
        string purpose,
        uint256 timestamp
    );

    // logs when a participant approves a request
    event ConsentGranted (
        uint256 indexed requestId,
        address indexed participant,
        uint256 timestamp
    );

    // logs when a participant revokes a consent
    event ConsentRevoked (
        uint256 indexed requestId,
        address indexed participant,
        uint256 timestamp
    );

    // checks that only the contract owner can call the function
    modifier checkOwner() {
        require(msg.sender == owner, "Owner does not match");
        _;
    }

    // checks that only the approved intermediary account can call the function
    modifier checkIntermediary() {
        require(msg.sender == intermediary, "Intermediary does not match");
        _;
    }

    // checks that the requestId is valid
    modifier checkRequestId(uint256 requestId) {
        require(requestId < nextRequestId, "Request does not exist");
        _;
    }

    // sets the contract owner and the initial intermediary address
    constructor(address _intermediary){
        require(_intermediary != address(0), "Invalid intermediary address");
        owner = msg.sender;
        intermediary = _intermediary;
        nextRequestId = 0;
    }

    // update the intermediary account
    function setIntermediary(address newIntermediary) external checkOwner {
        require(newIntermediary != address(0), "Invalid intermediary address");

        address oldIntermediary = intermediary;
        intermediary = newIntermediary;
        
        emit IntermediaryUpdated(oldIntermediary, newIntermediary);
    }

    // to create a new access request for a participant's off-chain data
    function requestAccess(
        address participant,
        address requester,
        string calldata requesterName,
        string calldata dataId,
        string calldata purpose
    ) external checkIntermediary returns (uint256 requestId) {
        require(participant != address(0), "Invalid participant address");
        require(requester != address(0), "Invalid requester address");
        require(bytes(requesterName).length > 0, "Requester name is required");
        require(bytes(dataId).length > 0, "Data ID is required");
        require(bytes(purpose).length > 0, "Purpose is required");

        requestId = nextRequestId;

        // store the new request on-chain
        requests[requestId] = AccessRequest({
            requestId: requestId,
            participant: participant,
            requester: requester,
            requesterName: requesterName,
            dataId: dataId,
            purpose: purpose,
            status: ConsentStatus.Pending,
            requestedAt: block.timestamp,
            updatedAt: block.timestamp
        });

        participantToRequestIds[participant].push(requestId);
        nextRequestId++;

        // emit event so that the request is logged on-chain
        emit AccessRequested(
            requestId,
            participant,
            requester,
            requesterName,
            dataId,
            purpose,
            block.timestamp
        );
    }

    // allows the participant to appove a pending request
    function grantConsent(uint256 requestId) external checkRequestId(requestId){
        AccessRequest storage req = requests[requestId];

        require(msg.sender == req.participant, "Participant does not match");
        require(req.status == ConsentStatus.Pending, "Request is not in pending status");

        req.status = ConsentStatus.Granted;
        req.updatedAt = block.timestamp;

        emit ConsentGranted(requestId, msg.sender, block.timestamp);
    }

    // allows the participant to revoke a granted consent
    function revokeConsent(uint256 requestId) external checkRequestId(requestId){
        AccessRequest storage req = requests[requestId];

        require(msg.sender == req.participant, "Participant does not match");
        require(req.status == ConsentStatus.Granted, "Request is not granted");

        req.status = ConsentStatus.Revoked;
        req.updatedAt = block.timestamp;

        emit ConsentRevoked(requestId, msg.sender, block.timestamp);
    }

    // check whether consent is granted for a request
    function checkAccess(uint256 requestId) external view checkRequestId(requestId) returns (bool) {
        return requests[requestId].status == ConsentStatus.Granted;
    }
}