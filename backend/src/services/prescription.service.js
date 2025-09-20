import { prisma } from "../configs/prismaClient.js";
import { redis } from "../configs/redisClient.js";


export async function createPrescription(userId, data) {
  try {
    const { medicines, ...rest } = data;

    const prescription = await prisma.prescription.create({
      data: {
        ...rest,
        user: { connect: { id: userId } },
        medicines: medicines
          ? { create: medicines } 
          : null,
      },
      include: { medicines: true },
    });

    await redis.del(`user:${userId}:prescriptions`);
    return prescription;
  } catch (err) {
    throw new Error("Failed to create prescription: " + err.message);
  }
}

export async function getUserPrescriptions(userId) {
  try {
    const cacheKey = `user:${userId}:prescriptions`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const prescriptions = await prisma.prescription.findMany({
      where: { userId },
      include: { medicines: true },
    });

    await redis.set(cacheKey, JSON.stringify(prescriptions), "EX", 300);
    return prescriptions;
  } catch (err) {
    throw new Error("Failed to fetch prescriptions: " + err.message);
  }
}

export async function getPrescriptionById(id) {
  try {
    const cacheKey = `prescription:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true },
    });

    if (prescription) {
      await redis.set(cacheKey, JSON.stringify(prescription), "EX", 300);
    }
    return prescription;
  } catch (err) {
    throw new Error("Failed to fetch prescription: " + err.message);
  }
}

export async function updatePrescription(id, inputData) {
  try {
    const {
      id: _,
      createdAt,
      userId,
      medicines,
      ...otherData
    } = inputData;

    const medicineUpdates = medicines?.map((medicine) => ({
      where: { id: medicine.id },
      data: {
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        duration: medicine.duration,
        instruction: medicine.instruction,
        status: medicine.status
      }
    })) || [];

    const updateData = {
      ...otherData,
      ...(userId && {
        user: { connect: { id: userId } }
      }),
      ...(medicineUpdates.length > 0 && {
        medicines: { update: medicineUpdates }
      })
    };

    const updated = await prisma.prescription.update({
      where: { id },
      data: updateData,
      include: { medicines: true },
    });

    await Promise.all([
      redis.del(`prescription:${id}`),
      redis.del(`user:${updated.userId}:prescriptions`)
    ]);

    return updated;
  } catch (err) {
    console.error("Error updating prescription:", err);
    throw new Error("Failed to update prescription: " + err.message);
  }
}



export async function deletePrescription(id) {
  try {
    const deleted = await prisma.prescription.delete({
      where: { id },
    });

    await redis.del(`prescription:${id}`);
    await redis.del(`user:${deleted.userId}:prescriptions`);
    return deleted;
  } catch (err) {
    throw new Error("Failed to delete prescription: " + err.message);
  }
}


