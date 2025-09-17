import { prisma } from "../configs/prismaClient.js";
import { redis } from "../configs/redisClient.js";

export async function createMedicine(prescriptionId, data) {
  try {
    const medicine = await prisma.medicine.create({
      data: {
        ...data,
        prescription: { connect: { id: prescriptionId } },
      },
    });

    await redis.del(`prescription:${prescriptionId}:medicines`);
    await redis.del(`prescription:${prescriptionId}`);
    return medicine;
  } catch (err) {
    throw new Error("Failed to create medicine: " + err.message);
  }
}

export async function getMedicinesByPrescription(prescriptionId) {
  try {
    const cacheKey = `prescription:${prescriptionId}:medicines`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const medicines = await prisma.medicine.findMany({
      where: { prescriptionId },
    });

    await redis.set(cacheKey, JSON.stringify(medicines), "EX", 300);
    return medicines;
  } catch (err) {
    throw new Error("Failed to fetch medicines: " + err.message);
  }
}

export async function updateMedicine(id, data) {
  try {
    const updated = await prisma.medicine.update({
      where: { id },
      data,
    });

    await redis.del(`prescription:${updated.prescriptionId}:medicines`);
    await redis.del(`prescription:${updated.prescriptionId}`);
    return updated;
  } catch (err) {
    throw new Error("Failed to update medicine: " + err.message);
  }
}

export async function deleteMedicine(id) {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (!medicine) return null;
    const deleted = await prisma.medicine.delete({
      where: { id },
    });

    await redis.del(`prescription:${medicine.prescriptionId}:medicines`);
    await redis.del(`prescription:${medicine.prescriptionId}`);
    return deleted;
  } catch (err) {
    throw new Error("Failed to delete medicine: " + err.message);
  }
}

export async function getUserAllActiveMedicines(userId) {
  try {
    const cacheKey = `user:${userId}:active_medicines`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const medicines = await prisma.medicine.findMany({
      where: {
        prescription: {
          userId,
          endDate: {
            gte: new Date()
          },
        },
      },
    });
    await redis.set(cacheKey, JSON.stringify(medicines), "EX", 300);
    return medicines;
  } catch (err) {
    throw new Error("Failed to fetch active medicines: " + err.message);
  }
}
