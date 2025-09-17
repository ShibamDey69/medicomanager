import { validateAuthToken } from "../services/redis-auth.service.js";
import { HTTP_ERROR_CODES } from "../constants/index.js";
import Response from "../handlers/responseHandler.js";

const authenticate = async (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return new Response(
      res,
      HTTP_ERROR_CODES.UNAUTHORIZED,
      "Authentication token is missing"
    );
  }

  const decoded = await validateAuthToken(token);

  if (!decoded) {
    return new Response(
      res,
      HTTP_ERROR_CODES.UNAUTHORIZED,
      "Invalid or expired token"
    );
  }

  req.user = {
    userId: decoded.userId,
    phoneNumber: decoded.phoneNumber,
  };

  next();
};

export default authenticate;
