const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CrowdfundingFactory", (m) => {
  const factory = m.contract("CrowdfundingFactory");

  // The Campaign implementation is deployed inside the factory constructor,
  // so a single contract deployment wires up the whole system.

  return { factory };
});
