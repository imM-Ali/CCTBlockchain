const Migrations = artifacts.require("Taxi");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};