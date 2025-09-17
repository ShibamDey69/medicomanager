import {
  createMedicine,
  getMedicinesByPrescription,
  updateMedicine,
  getUserAllActiveMedicines as getActiveMedicinesByUser,
  deleteMedicine,
} from "../services/medicine.service.js";
import { SUCCESS_CODES, HTTP_ERROR_CODES } from "../constants/index.js";
import Response from "../handlers/responseHandler.js";

class Medicine {
  constructor() {}

  async create(req, res) {
    try {
      const prescriptionId = req.params.prescriptionId;
      if (!prescriptionId)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const data = req.body;
      if (!data || Object.keys(data).length === 0)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      if (!data.name || !data.dosage || !data.frequency) {
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);
      }

      const medicine = await createMedicine(prescriptionId, data);
      if (!medicine)
        return new Response(res, HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR);

      return new Response(res, SUCCESS_CODES.CREATED, medicine);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllByPrescription(req, res) {
    try {
      const prescriptionId = req.params.prescriptionId;
      if (!prescriptionId)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const medicines = await getMedicinesByPrescription(prescriptionId);
      if (!medicines || medicines.length === 0)
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      return new Response(res, SUCCESS_CODES.OK, medicines);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getAllActiveMedicines(req, res) {
    try {
      const userId = req.params.userId;
      if (!userId) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);
      const medicines = await getActiveMedicinesByUser(userId);
      if (!medicines || medicines.length === 0)
        return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);
      return new Response(res, SUCCESS_CODES.OK, medicines);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async update(req, res) {
    try {
      const id = req.params.id;
      if (!id) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const data = req.body;
      if (!data || Object.keys(data).length === 0)
        return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);

      const updated = await updateMedicine(id, data);
      if (!updated) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);

      return new Response(res, SUCCESS_CODES.OK, updated);
    } catch (error) {
      console.log(error);
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      if (!id) return new Response(res, HTTP_ERROR_CODES.BAD_REQUEST);
      const deleted = await deleteMedicine(id);
      if (!deleted) return new Response(res, HTTP_ERROR_CODES.NOT_FOUND);
      return new Response(res, SUCCESS_CODES.OK, deleted);
    } catch (error) {
      return new Response(
        res,
        HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}

export default Medicine;
