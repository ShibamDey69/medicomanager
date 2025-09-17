
import logger from "../utils/logger.js";
import { HTTP_ERROR_CODES } from "../constants/index.js"
class Response {
  constructor(res, responseObj, data = {}) {
    this.res = res;
    this.responseObj = responseObj;
    this.data = data;

    this.send();
  }

  formatResponse({ code, status, message }, data = {}) {
    return { code, status, message, data };
  }

  send() {
    let { responseObj, res, data } = this;

    if (!responseObj || !responseObj.status || !responseObj.code) {
      logger.warn("Invalid response object, using fallback.");
      responseObj = {
        code: "UNKNOWN",
        status: 500,
        message: "Unknown response type.",
      };
    }

    let logMethod = "info";
    let logPrefix = "[SUCCESS]";

    if (Object.values(HTTP_ERROR_CODES).some(e => e.code === responseObj.code)) {
      logMethod = "error";
      logPrefix = "[HTTP_ERROR]";
    }

    logger[logMethod](
      `${logPrefix} ${responseObj.status} - ${responseObj.code}: ${responseObj.message}`
    );

    res
      .status(responseObj.status)
      .json(this.formatResponse(responseObj, data));
  }
}

export default Response;
