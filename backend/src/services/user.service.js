import { prisma } from "../configs/prismaClient.js";
import { redis } from "../configs/redisClient.js";

async function loginOrCreateAccount(phoneNumber) {
  try {
    let account = await prisma.account.findUnique({
      where: { phoneNumber },
      include: { user: true },
    });

    if (!account) {
      account = await prisma.account.create({
        data: { phoneNumber, user: { create: {} } },
        include: { user: true },
      });
    }

    return account;
  } catch (err) {
    throw new Error(`Failed to verify phone or create account: ${err.message}`);
  }
}

async function getUserProfile(userId) {
  try {

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        prescriptions: {
          include: {
            medicines: true, // fetch medicines under each prescription
          },
        },
      },
    });
    if (!user) return null;
    return user;
  } catch (err) {
    throw new Error(`Failed to fetch user profile: ${err.message}`);
  }
}

async function updateUserProfile(userId, data) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    await redis.set(
      `user:${userId}:profile`,
      JSON.stringify(updated),
      "EX",
      300
    );
    return updated;
  } catch (err) {
    throw new Error(`Failed to update user profile: ${err.message}`);
  }
}

export { loginOrCreateAccount, getUserProfile, updateUserProfile };
