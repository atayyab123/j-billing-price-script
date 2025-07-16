const dbProduction = require("../configs/databaseProduction.config");
const dbProductionManagement = require("../configs/databaseManagementProduction.config");
const dbStaging = require("../configs/databaseStaging.config");
const dbStagingManagement = require("../configs/databaseManagementStaging.config");
const dbLocal = require("../configs/databaseLocal.config");
const dbMyLocal = require("../configs/databaseMyLocal.config");

const isProductionEnv = () => process.env.NODE_ENV === "production";
const isManagementEnv = () => process.env.MANAGEMENT_IP === "true";
const isStagingEnv = () => process.env.NODE_ENV === "staging";
const isMyLocalEnv = () => process.env.NODE_ENV === "myLocalhost";

function getBaseUrl() {
  const isProduction = isProductionEnv();
  const isManagement = isManagementEnv();
  let baseUrl1 = "";
  let baseUrl2 = "";

  if (isProduction && !isManagement) {
    baseUrl1 = `http://${process.env.PRODUCTION_IP_URL}:${process.env.HTTP_PORT}`;
    baseUrl2 = `http://${process.env.PRODUCTION_IP_URL}:${process.env.HTTP_PORT}`;
  }
  if (isProduction && isManagement) {
    baseUrl1 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
    baseUrl2 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
  }
  if (!isProduction && !isManagement) {
    baseUrl1 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
    baseUrl2 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
  }
  if (!isProduction && isManagement) {
    baseUrl1 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
    baseUrl2 = `http://${process.env.MANAGEMENT_IP_URL}:${process.env.HTTP_PORT}`;
  }

  return { baseUrl1, baseUrl2 };
}

function selectDataBase() {
  const isProduction = isProductionEnv();
  const isManagement = isManagementEnv();
  const isStaging = isStagingEnv();
  const isMyLocal = isMyLocalEnv();

  if (isProduction && !isManagement) {
    console.log("Using Production Database");
    return dbProduction;
  }
  else if (isProduction && isManagement) return dbProductionManagement;
  else if (isStaging && !isManagement) return dbStaging;
  else if (isStaging && isManagement) return dbStagingManagement;
  else if (isMyLocal && !isManagement) return dbMyLocal;
  return dbLocal;
}

module.exports = { getBaseUrl, selectDataBase };
