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

    address public owner;                   // contract owner who can update key configuration
    // address public intermediary;         // approved intermediary account that is allowed to create requests --> not used anymore since requester is directly requesting to participant
    uint256 public nextRequestId;           // counter that generates a unique id

    mapping(uint256 => AccessRequest) public requests;
    mapping(address => uint256[]) private participantToRequestIds;

    // to check if the requester is approved or not
    mapping(address => bool) public approvedRequesters;

    // approved requester list (for admin/study runner)
    address[] public approvedRequesterList;

    // logs when approved intermediary account changes --> not used anymore
    // event IntermediaryUpdated (
    //    address indexed oldIntermediary,
    //    address indexed newIntermediary
    //);

    // logs when a new access request is created
    event AccessRequested (
        uint256 indexed requestId,
        address indexed participant,
        address indexed requester,
        string requesterName,
        string dataId,          // what data they are using (if participant have multiple data) - could be hashed ?
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

    // checks if the requester has permission
    modifier checkApprovedRequester() {
        require(approvedRequesters[msg.sender], "Not an approved requester");
        _;
    }

    // checks that the requestId is valid
    modifier checkRequestId(uint256 requestId) {
        require(requestId < nextRequestId, "Request does not exist");
        _;
    }

    // sets the contract owner and the initial intermediary address
    constructor(){
        owner = msg.sender;
        nextRequestId = 0;
    }

    // update the intermediary account --> not used anymore
    // function setIntermediary(address newIntermediary) external checkOwner {
    //    require(newIntermediary != address(0), "Invalid intermediary address");
    //
    //    address oldIntermediary = intermediary;
    //    intermediary = newIntermediary;
    //    
    //    emit IntermediaryUpdated(oldIntermediary, newIntermediary);
    //}

    // to create a new access request for a participant's off-chain data
    function requestAccess(
        address participant,
        string calldata requesterName,
        string calldata dataId,
        string calldata purpose
    ) external checkApprovedRequester returns (uint256 requestId) {
        require(participant != address(0), "Invalid participant address");
        require(bytes(requesterName).length > 0, "Requester name is required");
        require(bytes(dataId).length > 0, "Data ID is required");
        require(bytes(purpose).length > 0, "Purpose is required");

        requestId = nextRequestId;

        // store the new request on-chain
        requests[requestId] = AccessRequest({
            requestId: requestId,
            participant: participant,
            requester: msg.sender,          // requester is the msg.sender since they are directly requesting the consent, not an intermediary
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
            msg.sender,
            requesterName,
            dataId,
            purpose,
            block.timestamp
        );
    }

    // allows the participant to approve a pending request
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

    // 
    function approveRequester(address requester) external checkOwner {
        require(requester != address(0), "Invalid requester address");
        require(!approvedRequesters[requester], "Requester is already approved");

        approvedRequesters[requester] = true;
        approvedRequesterList.push(requester);
    }

    function revokeRequester(address requester) external checkOwner {
        require(approvedRequesters[requester], "Requester is not approved");
        approvedRequesters[requester] = false;

        for (uint256 i = 0; i < approvedRequesterList.length; i++){
            if(approvedRequesterList[i] == requester){
                approvedRequesterList[i] = approvedRequesterList[approvedRequesterList.length-1];
                approvedRequesterList.pop();
                break;
            }
        }
    }

    // get all approved requester addresses
    function getApprovedRequesterList() external view returns (address[] memory) {
        return approvedRequesterList;
    }

    // get all the request IDs associated with a participant
    function getParticipantRequestIds(address participant) external view returns(uint256[] memory){
        return participantToRequestIds[participant];
    }
}