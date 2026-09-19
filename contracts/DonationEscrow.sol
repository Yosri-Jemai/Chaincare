// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationEscrow {
    enum Status { RECEIVED, PARTIALLY_RELEASED, FULLY_RELEASED, REFUNDED }

    struct NGO {
        string  ngoId;
        string  name;
        string  description;
        address wallet;
        bytes32 kycHash;
        bool    active;
        uint256 registeredAt;
        uint256 totalReceived;
    }

    struct Donation {
        string  donationId;
        string  ngoId;
        string  cause;
        address donor;
        address ngoWallet;
        uint256 amount;         // net amount escrowed (after platform fee)
        uint256 released;
        uint256 platformFee;    // fee taken at donation time
        uint256 createdAt;
        uint256 lastUpdatedAt;
        Status  status;
        bool    exists;
    }

    address public owner;
    address public feeCollector;
    uint256 public platformFeeBps;

    address[] public approvers;
    mapping(address => bool) public isApprover;

    mapping(string => NGO)      private ngos;
    string[]                    public  ngoIds;
    mapping(string => Donation) private donations;
    string[]                    public  donationIds;

    event PlatformFeeCollected(string donationId, address indexed collector, uint256 amount);
    event FeeCollectorUpdated(address indexed newCollector);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event NGORegistered(string ngoId, string name, address indexed wallet, bytes32 kycHash);
    event NGODeactivated(string ngoId);
    event DonationReceived(string donationId, address indexed donor, address indexed ngoWallet, string ngoId, string cause, uint256 amount, uint256 fee);
    event FundsReleased(string donationId, address indexed ngoWallet, uint256 amount, string reason, uint256 remaining);
    event DonationDistributed(string donationId, address indexed ngoWallet, uint256 total);
    event DonationRefunded(string donationId, address indexed donor, uint256 amount, string reason);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyApprover() { require(isApprover[msg.sender], "Not approver"); _; }

    constructor(address[] memory _approvers, address _feeCollector, uint256 _platformFeeBps) {
        require(_platformFeeBps <= 1000, "Fee cannot exceed 10%");
        owner = msg.sender;
        approvers = _approvers;
        for (uint256 i = 0; i < _approvers.length; i++) {
            isApprover[_approvers[i]] = true;
        }
        feeCollector = _feeCollector;
        platformFeeBps = _platformFeeBps;
    }

    // ───────────── Revenue admin ─────────────

    function setFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
        emit FeeCollectorUpdated(_newCollector);
    }

    function setPlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee cannot exceed 10%");
        platformFeeBps = _newFeeBps;
        emit PlatformFeeUpdated(_newFeeBps);
    }

    // ───────────── NGO registry ─────────────

    function registerNGO(
        string calldata ngoId,
        string calldata name,
        string calldata description,
        address wallet,
        bytes32 kycHash
    ) external onlyApprover {
        require(bytes(ngoId).length > 0, "ngoId required");
        require(bytes(ngos[ngoId].ngoId).length == 0, "Already registered");
        require(wallet != address(0), "wallet required");

        ngos[ngoId] = NGO({
            ngoId: ngoId,
            name: name,
            description: description,
            wallet: wallet,
            kycHash: kycHash,
            active: true,
            registeredAt: block.timestamp,
            totalReceived: 0
        });
        ngoIds.push(ngoId);
        emit NGORegistered(ngoId, name, wallet, kycHash);
    }

    function deactivateNGO(string calldata ngoId) external onlyOwner {
        require(bytes(ngos[ngoId].ngoId).length > 0, "Unknown NGO");
        ngos[ngoId].active = false;
        emit NGODeactivated(ngoId);
    }

    function getNGO(string calldata ngoId) external view returns (NGO memory) {
        return ngos[ngoId];
    }
    function getNGOCount() external view returns (uint256) { return ngoIds.length; }
    function getNGOIdAt(uint256 i) external view returns (string memory) { return ngoIds[i]; }

    // ───────────── Donations ─────────────

    function donate(
        string calldata donationId,
        string calldata ngoId,
        string calldata cause
    ) external payable {
        NGO storage ngo = ngos[ngoId];
        require(bytes(ngo.ngoId).length > 0, "NGO not registered");
        require(ngo.active, "NGO not active");
        require(msg.value > 0, "Amount must be > 0");
        require(!donations[donationId].exists, "Duplicate donationId");

        uint256 feeAmount = (msg.value * platformFeeBps) / 10000;
        uint256 escrowAmount = msg.value - feeAmount;

        if (feeAmount > 0) {
            (bool feeOk, ) = payable(feeCollector).call{value: feeAmount}("");
            require(feeOk, "Fee transfer failed");
            emit PlatformFeeCollected(donationId, feeCollector, feeAmount);
        }

        donations[donationId] = Donation({
            donationId: donationId,
            ngoId: ngoId,
            cause: cause,
            donor: msg.sender,
            ngoWallet: ngo.wallet,
            amount: escrowAmount,
            released: 0,
            platformFee: feeAmount,
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            status: Status.RECEIVED,
            exists: true
        });
        donationIds.push(donationId);
        ngo.totalReceived += escrowAmount;

        emit DonationReceived(donationId, msg.sender, ngo.wallet, ngoId, cause, escrowAmount, feeAmount);
    }

    function releaseFunds(
        string calldata donationId,
        uint256 amount,
        string calldata reason
    ) external {
        Donation storage d = donations[donationId];
        require(d.exists, "Unknown donation");
        require(
            msg.sender == d.ngoWallet || isApprover[msg.sender],
            "Only NGO or approver"
        );
        require(amount > 0 && d.released + amount <= d.amount, "Bad amount");
        require(d.status != Status.REFUNDED, "Refunded");

        d.released += amount;
        d.lastUpdatedAt = block.timestamp;
        d.status = (d.released == d.amount)
            ? Status.FULLY_RELEASED
            : Status.PARTIALLY_RELEASED;

        (bool ok, ) = payable(d.ngoWallet).call{value: amount}("");
        require(ok, "Transfer failed");

        emit FundsReleased(donationId, d.ngoWallet, amount, reason, d.amount - d.released);
        if (d.status == Status.FULLY_RELEASED) {
            emit DonationDistributed(donationId, d.ngoWallet, d.amount);
        }
    }

    function refund(string calldata donationId, string calldata reason) external onlyOwner {
        Donation storage d = donations[donationId];
        require(d.exists && d.status == Status.RECEIVED, "Not refundable");
        d.status = Status.REFUNDED;
        d.lastUpdatedAt = block.timestamp;
        (bool ok, ) = payable(d.donor).call{value: d.amount}("");
        require(ok, "Refund failed");
        emit DonationRefunded(donationId, d.donor, d.amount, reason);
    }

    // ───────────── Views ─────────────

    function getDonation(string calldata donationId) external view returns (Donation memory) {
        require(donations[donationId].exists, "Unknown");
        return donations[donationId];
    }
    function getDonationCount() external view returns (uint256) { return donationIds.length; }
    function getDonationIdAt(uint256 i) external view returns (string memory) { return donationIds[i]; }
}