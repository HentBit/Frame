const config = require("../config");

function logger(level, method, url, status, message = "") {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDate = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  const extraMessage = message ? ` | Msg: ${message}` : "";
  const logLine = `[${formattedDate}] [${level}] - - > ${method} ${url} | Status: ${status}${extraMessage}`;

  if (config.NODE_ENV === "production") {
    if (status >= 400) process.stderr.write(logLine + "\n");
  } else {
    if (status >= 400) process.stderr.write(logLine + "\n");
    else process.stdout.write(logLine + "\n");
  }
}

module.exports = logger;
