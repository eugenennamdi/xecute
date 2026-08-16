// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title XecuteTestnetRouter
 * @notice Dedicated swap router and liquidity settlement contract for X Layer Testnet (Chain ID 1952).
 * Supports swaps between Native OKB, USDT, USDC, and USDG with preflight check verification.
 */
contract XecuteTestnetRouter {
    address public immutable owner;
    string public constant name = "Xecute Testnet Swap Router";
    string public constant version = "1.0.0";
    uint256 public constant CHAIN_ID = 1952;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

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

        uint8 dec = 6;
        if (tokenOut.code.length > 0) {
            (bool ok, bytes memory data) = tokenOut.staticcall(abi.encodeWithSignature("decimals()"));
            if (ok && data.length >= 32) {
                dec = abi.decode(data, (uint8));
            }
        }

        // Rate: 1 OKB ($60) = 60 USD tokens
        amountOut = (msg.value * 60 * (10 ** uint256(dec))) / 1e18;
        if (amountOut == 0) amountOut = 1;
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        // If token contract has liquidity, transfer to recipient
        if (tokenOut.code.length > 0) {
            (bool okBal, bytes memory balData) = tokenOut.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
            if (okBal && balData.length >= 32) {
                uint256 bal = abi.decode(balData, (uint256));
                if (bal >= amountOut) {
                    tokenOut.call(abi.encodeWithSignature("transfer(address,uint256)", recipient, amountOut));
                }
            }
        }

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

        if (tokenIn.code.length > 0) {
            tokenIn.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amountIn));
        }

        uint8 dec = 6;
        if (tokenIn.code.length > 0) {
            (bool ok, bytes memory data) = tokenIn.staticcall(abi.encodeWithSignature("decimals()"));
            if (ok && data.length >= 32) {
                dec = abi.decode(data, (uint8));
            }
        }

        // 60 USD tokens = 1 OKB (1e18 wei)
        amountOut = (amountIn * 1e18) / (60 * (10 ** uint256(dec)));
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        if (address(this).balance >= amountOut) {
            (bool sent, ) = recipient.call{value: amountOut}("");
            require(sent, "Native transfer failed");
        }

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

        if (tokenIn.code.length > 0) {
            tokenIn.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amountIn));
        }

        uint8 decIn = 6;
        uint8 decOut = 6;
        if (tokenIn.code.length > 0) {
            (bool ok, bytes memory data) = tokenIn.staticcall(abi.encodeWithSignature("decimals()"));
            if (ok && data.length >= 32) decIn = abi.decode(data, (uint8));
        }
        if (tokenOut.code.length > 0) {
            (bool ok, bytes memory data) = tokenOut.staticcall(abi.encodeWithSignature("decimals()"));
            if (ok && data.length >= 32) decOut = abi.decode(data, (uint8));
        }

        amountOut = (amountIn * (10 ** uint256(decOut))) / (10 ** uint256(decIn));
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        if (tokenOut.code.length > 0) {
            (bool okBal, bytes memory balData) = tokenOut.staticcall(abi.encodeWithSignature("balanceOf(address)", address(this)));
            if (okBal && balData.length >= 32) {
                uint256 bal = abi.decode(balData, (uint256));
                if (bal >= amountOut) {
                    tokenOut.call(abi.encodeWithSignature("transfer(address,uint256)", recipient, amountOut));
                }
            }
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, recipient);
        return amountOut;
    }

    /// @notice Emergency withdraw function for router admin
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else if (token.code.length > 0) {
            token.call(abi.encodeWithSignature("transfer(address,uint256)", owner, amount));
        }
        emit EmergencyWithdraw(owner, token, amount);
    }
}
