const moment = require("moment");
const momentTimeZone = require("moment-timezone");

function displayDateTime() {
  return moment().format();
}

function displayDate() {
  return moment().format("L");
}

function displayDateReadable() {
  return moment().format("LL");
}

function displayDateTimeFullReadable() {
  return moment().format("LLLL");
}

function displayTime() {
  return moment().format("LTS");
}

function displayDateTimeUTC() {
  return moment().utc();
}

function displayDateTimeUTCReadable() {
  return moment().utc().format("LLLL");
}

function displayDateTimePakistan() {
  return momentTimeZone().tz("Asia/Karachi");
}

function displayDateTimeAustralia() {
  return momentTimeZone().tz("Australia/Melbourne");
}

function displayDateTimePakistanReadable() {
  return momentTimeZone().tz("Asia/Karachi").format("LLLL");
}

function calculateTimeDifference(startTime, endTime) {
  let milliSeconds = Math.abs(endTime - startTime);
  let seconds = milliSeconds / 1000;
  let minutes = seconds / 60;
  let hours = minutes / 60;
  return { seconds, milliSeconds };
}

module.exports = {
  displayDate,
  displayDateReadable,
  displayDateTime,
  displayDateTimeFullReadable,
  displayTime,
  displayDateTimeUTC,
  displayDateTimePakistan,
  calculateTimeDifference,
  displayDateTimePakistanReadable,
  displayDateTimeUTCReadable,
  displayDateTimeAustralia,
};
