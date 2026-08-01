// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Nox, euint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {INoxCompute} from "@iexec-nox/nox-protocol-contracts/contracts/interfaces/INoxCompute.sol";
import {TEEType} from "@iexec-nox/nox-protocol-contracts/contracts/utils/TypeUtils.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ConfidentialToken {
    address constant NOX_COMPUTE = 0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF;

    address public relayer;
    address public usdcToken;
    uint256 private _reentrancyStatus = 1;

    mapping(address => euint256) private _balances;
    mapping(address => euint256) private _cheques;
    mapping(address => bool) private _chequeClaimed;
    euint256 private _totalSupply;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Transferred(address indexed from, address indexed to, bytes32 indexed amountHandle);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event ChequeWritten(address indexed from, address indexed chequeId);
    event ChequeClaimed(address indexed to, address indexed chequeId);

    modifier nonReentrant() {
        require(_reentrancyStatus != 2, "reentrant call");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    constructor(address _usdcToken) {
        relayer = msg.sender;
        usdcToken = _usdcToken;
        _totalSupply = Nox.toEuint256(0);
    }

    function setRelayer(address newRelayer) external {
        require(msg.sender == relayer, "only relayer");
        emit RelayerUpdated(relayer, newRelayer);
        relayer = newRelayer;
    }

    function deposit() public payable {
        require(msg.value > 0, "zero deposit");
        _mintInternal(msg.sender, msg.value);
        emit Deposited(msg.sender, msg.value);
    }

    function depositUSDC(uint256 amount) external nonReentrant {
        require(amount > 0, "zero deposit");
        require(usdcToken != address(0), "USDC not configured");
        require(IERC20(usdcToken).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        _mintInternal(msg.sender, amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(
        bytes32 handle,
        bytes calldata proof,
        uint256 plaintextAmount
    ) external nonReentrant {
        _burnInternal(msg.sender, handle, proof);
        (bool sent,) = payable(msg.sender).call{value: plaintextAmount}("");
        require(sent, "withdraw failed");
        emit Withdrawn(msg.sender, plaintextAmount);
    }

    function withdrawUSDC(
        bytes32 handle,
        bytes calldata proof,
        uint256 plaintextAmount
    ) external nonReentrant {
        require(usdcToken != address(0), "USDC not configured");
        _burnInternal(msg.sender, handle, proof);
        require(IERC20(usdcToken).transfer(msg.sender, plaintextAmount), "USDC transfer failed");
        emit Withdrawn(msg.sender, plaintextAmount);
    }

    function transfer(address to, bytes32 handle, bytes calldata proof) external {
        _transfer(msg.sender, to, handle, proof);
    }

    function relayedTransfer(address from, address to, bytes32 handle, bytes calldata proof) external {
        require(msg.sender == relayer, "only relayer");
        _transfer(from, to, handle, proof);
    }

    function relayedWithdrawUSDC(
        address from,
        address to,
        bytes32 handle,
        bytes calldata proof,
        uint256 plaintextAmount
    ) external {
        require(msg.sender == relayer, "only relayer");
        require(usdcToken != address(0), "USDC not configured");
        require(from != address(0) && to != address(0), "zero address");

        _burnInternal(from, handle, proof);
        require(IERC20(usdcToken).transfer(to, plaintextAmount), "USDC transfer failed");
        emit Withdrawn(from, plaintextAmount);
    }

    function relayedWriteCheque(
        address from,
        address chequeId,
        bytes32 handle,
        bytes calldata proof
    ) external {
        require(msg.sender == relayer, "only relayer");
        require(from != address(0) && chequeId != address(0), "zero address");
        require(!_chequeClaimed[chequeId], "cheque claimed");
        require(euint256.unwrap(_cheques[chequeId]) == bytes32(0), "cheque exists");

        _ensureBalance(from);
        _cheques[chequeId] = Nox.toEuint256(0);

        INoxCompute(NOX_COMPUTE).validateInputProof(handle, from, proof, TEEType.Uint256);
        euint256 amount = euint256.wrap(handle);
        Nox.allowThis(amount);

        (, _balances[from], _cheques[chequeId]) = Nox.transfer(_balances[from], _cheques[chequeId], amount);
        Nox.allowThis(_balances[from]);
        Nox.addViewer(_balances[from], from);
        Nox.allowThis(_cheques[chequeId]);
        Nox.addViewer(_cheques[chequeId], chequeId);

        emit ChequeWritten(from, chequeId);
    }

    function relayedClaimCheque(address to, uint8 v, bytes32 r, bytes32 s) external {
        require(msg.sender == relayer, "only relayer");
        require(to != address(0), "zero address");

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n20", to)
        );
        address chequeId = ecrecover(ethSignedMessageHash, v, r, s);
        require(chequeId != address(0), "invalid signature");
        require(!_chequeClaimed[chequeId], "cheque claimed");
        require(euint256.unwrap(_cheques[chequeId]) != bytes32(0), "cheque missing");

        _ensureBalance(to);
        _chequeClaimed[chequeId] = true;

        (, _cheques[chequeId], _balances[to]) = Nox.transfer(
            _cheques[chequeId],
            _balances[to],
            _cheques[chequeId]
        );
        Nox.allowThis(_cheques[chequeId]);
        Nox.allowThis(_balances[to]);
        Nox.addViewer(_balances[to], to);

        emit ChequeClaimed(to, chequeId);
    }

    function isUserInitialized(address user) external view returns (bool) {
        return euint256.unwrap(_balances[user]) != bytes32(0);
    }

    function _mintInternal(address user, uint256 rawAmount) private {
        _ensureBalance(user);
        euint256 amount = Nox.toEuint256(rawAmount);
        (, _balances[user], _totalSupply) = Nox.mint(_balances[user], amount, _totalSupply);
        Nox.allowThis(_balances[user]);
        Nox.addViewer(_balances[user], user);
        Nox.allowThis(_totalSupply);
    }

    function _burnInternal(address user, bytes32 handle, bytes calldata proof) private {
        _ensureBalance(user);
        INoxCompute(NOX_COMPUTE).validateInputProof(handle, user, proof, TEEType.Uint256);
        euint256 amount = euint256.wrap(handle);
        Nox.allowThis(amount);
        (, _balances[user], _totalSupply) = Nox.burn(_balances[user], amount, _totalSupply);
        Nox.allowThis(_balances[user]);
        Nox.addViewer(_balances[user], user);
        Nox.allowThis(_totalSupply);
    }

    function _transfer(address from, address to, bytes32 handle, bytes calldata proof) private {
        require(from != address(0) && to != address(0), "zero address");
        _ensureBalance(from);
        _ensureBalance(to);
        INoxCompute(NOX_COMPUTE).validateInputProof(handle, from, proof, TEEType.Uint256);
        euint256 amount = euint256.wrap(handle);
        Nox.allowThis(amount);
        (, _balances[from], _balances[to]) = Nox.transfer(_balances[from], _balances[to], amount);
        Nox.allowThis(_balances[from]);
        Nox.addViewer(_balances[from], from);
        Nox.allowThis(_balances[to]);
        Nox.addViewer(_balances[to], to);
        emit Transferred(from, to, handle);
    }

    function _ensureBalance(address user) private {
        if (euint256.unwrap(_balances[user]) == bytes32(0)) {
            _balances[user] = Nox.toEuint256(0);
        }
    }

    function getBalanceHandle(address user) external view returns (bytes32) {
        return euint256.unwrap(_balances[user]);
    }
}
