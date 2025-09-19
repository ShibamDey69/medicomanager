import {
  loginOrCreateAccount,
  getUserProfile,
  updateUserProfile,
} from "../services/user.service.js";
import { admin } from "../configs/firebaseAdmin.js";
import { SUCCESS_CODES, HTTP_ERROR_CODES } from "../constants/index.js";
import Response from "../handlers/responseHandler.js";
import { generateAuthCookie, revokeAuthToken } from "../services/redis-auth.service.js";
class User {
  constructor() {}

  async login(req, res) {
    try {

      const idToken  = req.body.idToken;
      if (!idToken) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing idToken"
        );
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken?.phone_number;

      if (!phoneNumber) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing phone number in token"
        );
      }

      const response = await loginOrCreateAccount(phoneNumber);
      if (!response) {
        return new Response(
          res,
          HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
          "Failed to login or create account"
        );
      }

      const authToken = await generateAuthCookie(response.userId, phoneNumber);
      res.cookie("auth_token", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return new Response(res, SUCCESS_CODES.OK, response);
    } catch (error) {
      if (
        error.code === "auth/id-token-expired" ||
        error.code === "auth/argument-error" ||
        error.code === "auth/id-token-revoked"
      ) {
        return new Response(
          res,
          HTTP_ERROR_CODES.UNAUTHORIZED,
          "Invalid or expired token"
        );
      }
      console.error("Login error:", error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getUser(req, res) {
    try {
      const userId = req.params.id;
      if (!userId) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing userId"
        );
      }

      const user = await getUserProfile(userId);
      if (!user) {
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND, "User not found");
      }

      return new Response(res, SUCCESS_CODES.OK, user);
    } catch (error) {
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async createUser(req, res) {
    try {
      const userId = req.params.id;
      if (!userId) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing userId"
        );
      }

      const data = req.body;
      if (!data || Object.keys(data).length === 0) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Request body cannot be empty"
        );
      }

      const { name, DOB, gender, bloodGroup } = data;
      if (!name || !DOB || !gender || !bloodGroup) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing required fields: name, DOB, gender, bloodGroup"
        );
      }

      const newUser = await updateUserProfile(userId, data);
      return new Response(res, SUCCESS_CODES.CREATED, newUser);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      if (!userId) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Missing userId"
        );
      }

      const data = req.body;
      if (!data || Object.keys(data).length === 0) {
        return new Response(
          res,
          HTTP_ERROR_CODES.BAD_REQUEST,
          "Request body cannot be empty"
        );
      }

      const updatedUser = await updateUserProfile(userId, data);
      if (!updatedUser) {
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND, "User not found");
      }

      return new Response(res, SUCCESS_CODES.OK, updatedUser);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async logout(req, res) {
    try {
      const userId = req.userId; 
      if (!userId) {
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST, "Missing userId");
      }

      await revokeAuthToken(userId);
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return new Response(res, SUCCESS_CODES.OK, { message: "Logged out" });
    } catch (error) {
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export default User;
