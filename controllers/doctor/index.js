const dashboardController = require("./dashboardController");
const patientController = require("./patientController");
const patientHistoryController = require("./patientHistoryController");
const entryDetailController = require("./entryDetailController");

module.exports = {
  ...dashboardController,
  ...patientController,
  ...patientHistoryController,
  ...entryDetailController,
};
