// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title XecuteTestnetRouter
 * @notice Dedicated swap router and liquidity settlement contract for X Layer Testnet (Chain ID 1952).
 * Supports deterministic swaps between Native OKB, USDT, USDC, and USDG with preflight check verification.
 * Fails closed on any transfer failure, insufficient liquidity, zero amounts, or slippage constraint violations.
 */
contract XecuteTestnetRouter {
    address public immutable owner;
    string public constant name = "Xecute Testnet Swap Router";
    string public constant version = "1.1.0";
    uint256 public constant CHAIN_ID = 1952;

    mapping(address => bool) public supportedTokens;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

    event LiquiditySupplied(address indexed provider, address indexed token, uint256 amount);
    event EmergencyWithdraw(address indexed owner, address indexed token, uint256 amount);
    event SupportedTokenUpdated(address indexed token, bool supported);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Pre-configure verified X Layer Testnet faucet assets
        supportedTokens[0x9e29b3AaDa05Bf2D2c827Af80Bd28Dc0b9b4FB0c] = true; // Testnet USDT
        supportedTokens[0xcB8BF24c6cE16Ad21D707c9505421a17f2bec79D] = true; // Testnet USDC
        supportedTokens[0xA78E2baaBaf5c4f36b7Fc394725Deb68D332EeC1] = true; // Testnet USDG
    }

    receive() external payable {
        if (msg.value > 0) {
            emit LiquiditySupplied(msg.sender, address(0), msg.value);
        }
    }

    /// @notice Configure token allowlist for router swaps
    function setSupportedToken(address token, bool supported) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = supported;
        emit SupportedTokenUpdated(token, supported);
    }

    /// @notice Swap native OKB for ERC-20 testnet tokens (USDT, USDC, USDG)
    /// @param tokenOut Target ERC-20 token address
    /// @param minAmountOut Minimum acceptable amount of tokenOut (slippage protection)
    /// @param recipient Address to receive output tokens
    function swapExactOKBForTokens(
        address tokenOut,
        uint256 minAmountOut,
        address recipient
    ) external payable returns (uint256 amountOut) {
        require(msg.value > 0, "Zero OKB amount");
        require(recipient != address(0), "Invalid recipient");
        require(tokenOut != address(0), "Invalid tokenOut");
        require(supportedTokens[tokenOut], "Unsupported output token");

        uint8 dec = _getDecimals(tokenOut);

        // Rate: 1 OKB ($60) = 60 USD tokens
        amountOut = (msg.value * 60 * (10 ** uint256(dec))) / 1e18;
        require(amountOut > 0, "Zero output amount");
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        uint256 routerBalance = _getBalance(tokenOut, address(this));
        require(routerBalance >= amountOut, "Insufficient router liquidity");

        _safeTransfer(tokenOut, recipient, amountOut);

        emit Swap(msg.sender, address(0), tokenOut, msg.value, amountOut, recipient);
        return amountOut;
    }

    /// @notice Swap ERC-20 testnet tokens for native OKB
    /// @param tokenIn Source ERC-20 token address
    /// @param amountIn Amount of source token to swap
    /// @param minAmountOut Minimum acceptable amount of OKB (in wei)
    /// @param recipient Address to receive native OKB
    function swapExactTokensForOKB(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address payable recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Zero amountIn");
        require(recipient != address(0), "Invalid recipient");
        require(tokenIn != address(0), "Invalid tokenIn");
        require(supportedTokens[tokenIn], "Unsupported input token");

        uint8 dec = _getDecimals(tokenIn);

        // 60 USD tokens = 1 OKB (1e18 wei)
        amountOut = (amountIn * 1e18) / (60 * (10 ** uint256(dec)));
        require(amountOut > 0, "Zero output amount");
        require(amountOut >= minAmountOut, "Slippage limit exceeded");
        require(address(this).balance >= amountOut, "Insufficient router native liquidity");

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        (bool sent, ) = recipient.call{value: amountOut}("");
        require(sent, "Native transfer failed");

        emit Swap(msg.sender, tokenIn, address(0), amountIn, amountOut, recipient);
        return amountOut;
    }

    /// @notice Swap between two ERC-20 testnet tokens (e.g. USDT <-> USDC)
    /// @param tokenIn Source ERC-20 token address
    /// @param tokenOut Target ERC-20 token address
    /// @param amountIn Amount of source token to swap
    /// @param minAmountOut Minimum acceptable amount of tokenOut
    /// @param recipient Address to receive output tokens
    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Zero amountIn");
        require(recipient != address(0), "Invalid recipient");
        require(tokenIn != address(0), "Invalid tokenIn");
        require(tokenOut != address(0), "Invalid tokenOut");
        require(tokenIn != tokenOut, "Identical assets");
        require(supportedTokens[tokenIn], "Unsupported input token");
        require(supportedTokens[tokenOut], "Unsupported output token");

        uint8 decIn = _getDecimals(tokenIn);
        uint8 decOut = _getDecimals(tokenOut);

        amountOut = (amountIn * (10 ** uint256(decOut))) / (10 ** uint256(decIn));
        require(amountOut > 0, "Zero output amount");
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        uint256 routerBalance = _getBalance(tokenOut, address(this));
        require(routerBalance >= amountOut, "Insufficient router liquidity");

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        _safeTransfer(tokenOut, recipient, amountOut);

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, recipient);
        return amountOut;
    }

    /// @notice Supply ERC-20 liquidity to the router (only allowlisted test assets)
    function supplyLiquidity(address token, uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(token != address(0), "Invalid token");
        require(supportedTokens[token], "Unsupported token");
        _safeTransferFrom(token, msg.sender, address(this), amount);
        emit LiquiditySupplied(msg.sender, token, amount);
    }

    /// @notice Emergency withdraw function for router admin
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient native balance");
            (bool sent, ) = payable(owner).call{value: amount}("");
            require(sent, "Native withdrawal failed");
        } else {
            require(_getBalance(token, address(this)) >= amount, "Insufficient token balance");
            _safeTransfer(token, owner, amount);
        }
        emit EmergencyWithdraw(owner, token, amount);
    }

    // --- Internal Safe ERC-20 Helpers ---

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeERC20: transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeERC20: transferFrom failed");
    }

    function _getDecimals(address token) internal view returns (uint8) {
        require(token.code.length > 0, "Token is not a contract");
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSelector(0x313ce567));
        require(ok && data.length >= 32, "Decimals lookup failed");
        return abi.decode(data, (uint8));
    }

    function _getBalance(address token, address account) internal view returns (uint256) {
        if (token.code.length == 0) return 0;
        (bool ok, bytes memory data) = token.staticcall(abi.encodeWithSelector(0x70a08231, account));
        if (ok && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }
}
