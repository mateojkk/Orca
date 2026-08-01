import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ConfidentialTokenModule = buildModule("ConfidentialTokenModule", (m) => {
  const usdcAddress = m.getParameter("usdcAddress", SEPOLIA_USDC);
  const confidentialToken = m.contract("ConfidentialToken", [usdcAddress]);

  return { confidentialToken };
});

export default ConfidentialTokenModule;
