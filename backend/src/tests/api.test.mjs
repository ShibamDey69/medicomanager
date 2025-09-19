// src/tests/api.test.js
const axios = require("axios");
const FormData = require("form-data");

const BASE_URL = "http://localhost:5000/api";

let testUserId = "testUserId123";
let prescriptionId;
let medicineId;
let authCookie;
let ocrJobId;

const testImagePath =
  "https://i.pinimg.com/736x/d5/ef/9a/d5ef9a9629dc57e5b75266931235d9a7.jpg";

let testImageBuffer;

beforeAll(async () => {
  try {
    const res = await axios.get(testImagePath, { responseType: "arraybuffer" });
    console.log("Fetched test image, size:", res.data.length);
    testImageBuffer = Buffer.from(res.data);
  } catch (err) {
    console.log(err);
    console.warn("⚠️ Failed to fetch test image, OCR tests will be skipped");
    testImageBuffer = null;
  }
});

describe("API End-to-End Tests with manual cookie", () => {
  jest.setTimeout(60000);

  // -------- Login Route --------
  test("POST /users/login - should return auth data and set cookie", async () => {
    const payload = {
      idToken:
        "eyJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWVpY28tOTA5OTkiLCJhdWQiOiJtZWljby05MDk5OSIsImF1dGhfdGltZSI6MTc1ODMwMzEzMywidXNlcl9pZCI6IlNKNktRdjNYcG5PUkwwVEZIQTA5NDJHMkRDdzEiLCJzdWIiOiJTSjZLUXYzWHBuT1JMMFRGSEEwOTQyRzJEQ3cxIiwiaWF0IjoxNzU4MzAzMTMzLCJleHAiOjE3NTgzMDY3MzMsInBob25lX251bWJlciI6Iis5MTcwNDc1ODQ3NDEiLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7InBob25lIjpbIis5MTcwNDc1ODQ3NDEiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwaG9uZSJ9fQ.Tgh66Xx37krOEM3P_HUkxy1pf8cmUe8P-43lfSlRXp5PzySV2eX_ML9tMKaKNfb6ObOt5-Na8t_5lcEXex83-dxZrc7Rq601mjD9BiQT-hTPkD-DXkMccOxm9vs3TGWbuML6p5Pw8QtMTzZjqu_zUGJpAzyn1XfskcIhO7V1tzJ4OZd1gBtcAqiG0B99d_QWHAvua3bMqXCnSFISslOPyjw9CeaU0OG4miHbclSXVVs-7NwW7jF3Xu43NGA2DDX8s_vvM51L_GEySmdSLl9kxxITdecojeGYhXCVAbUZJSzgbSG5MEKHn_wb2s3PCYIp61WUSeqAlBo-CyOSuHjvWw",
    };

    const response = await axios
      .post(`${BASE_URL}/users/login`, payload)
      .catch((e) => e.response);

    console.log("login", response.data);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("data");
    expect(response.data.data).toHaveProperty("userId");

    authCookie = response.headers["set-cookie"][0];
    testUserId = response.data.data.user.id;
  });

  // -------- User Routes --------
  test("POST /users/:id - create user profile", async () => {
    const payload = {
      name: "Shibam Dey",
      DOB: "2003-01-01T00:00:00.000Z",
      gender: "Male",
      bloodGroup: "B+",
    };

    const response = await axios
      .post(`${BASE_URL}/users/${testUserId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("create user", response.data);

    expect(response.status).toBe(201);
    expect(response.data.data).toMatchObject(payload);
  });

  test("GET /users/:id - should return user profile", async () => {
    const response = await axios
      .get(`${BASE_URL}/users/${testUserId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("get user", response.data);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("data");
  });

  test("PUT /users/:id - update user profile", async () => {
    const payload = { name: "Shibam Dey", gender: "Male" };
    const response = await axios
      .put(`${BASE_URL}/users/${testUserId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("update user", response.data);

    expect(response.status).toBe(200);
    expect(response.data.data.name).toBe("Shibam Dey");
  });

  // -------- Prescription Routes --------
  test("POST /prescriptions/user/:userId - create prescription", async () => {
    const payload = {
      doctor: "Dr. Strange",
      specialty: "Cardiology",
      date: new Date(),
      status: "active",
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "2/day",
          duration: "5 days",
          instruction: "After food",
          status: "active",
        },
      ],
    };

    const response = await axios
      .post(`${BASE_URL}/prescriptions/user/${testUserId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("create prescription", response.data);

    expect(response.status).toBe(201);
    prescriptionId = response.data.data.id;
  });

  test("GET /prescriptions/:id - get prescription by id", async () => {
    const response = await axios
      .get(`${BASE_URL}/prescriptions/${prescriptionId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("get prescription by id", response.data);

    expect(response.status).toBe(200);
    expect(response.data.data.id).toBe(prescriptionId);
  });

  test("PUT /prescriptions/:id - update prescription", async () => {
    const payload = { status: "completed" };
    const response = await axios
      .put(`${BASE_URL}/prescriptions/${prescriptionId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("update prescription", response.data);

    expect(response.status).toBe(200);
    expect(response.data.data.status).toBe("completed");
  });

  // -------- Medicine Routes --------
  test("POST /medicines/prescription/:prescriptionId - create medicine", async () => {
    const payload = {
      name: "Ibuprofen",
      dosage: "200mg",
      frequency: "3/day",
      duration: "7 days",
      instruction: "After meals",
      status: "active",
    };

    const response = await axios
      .post(`${BASE_URL}/medicines/prescription/${prescriptionId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("create medicine", response.data);

    expect(response.status).toBe(201);
    medicineId = response.data.data.id;
  });

  test("PUT /medicines/:id - update medicine", async () => {
    const payload = { frequency: "2/day" };
    const response = await axios
      .put(`${BASE_URL}/medicines/${medicineId}`, payload, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("update medicine", response.data);

    expect(response.status).toBe(200);
    expect(response.data.data.frequency).toBe("2/day");
  });

  test("DELETE /medicines/:id - delete medicine", async () => {
    const response = await axios
      .delete(`${BASE_URL}/medicines/${medicineId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("delete medicine", response.data);

    expect(response.status).toBe(200);
  });

  test("DELETE /prescriptions/:id - delete prescription", async () => {
    const response = await axios
      .delete(`${BASE_URL}/prescriptions/${prescriptionId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);

    console.log("delete prescription", response.data);

    expect(response.status).toBe(200);
  });

  // -------- AI Chat Routes --------
  describe("AI Chat Routes", () => {
    let aiJobId;

    beforeAll(async () => {
      const question = "What medicines am I currently taking?";

      const response = await axios
        .post(
          `${BASE_URL}/ask/${testUserId}`,
          { question },
          { headers: { Cookie: authCookie } }
        )
        .catch((e) => e.response);

      console.log("AI Ask Response:", response?.data);

      expect(response.status).toBe(202);
      aiJobId = response.data.data.jobId;
      await new Promise((r) => setTimeout(r, 1500));
    });

    test("GET /answer/:jobId - should return processing status initially", async () => {
      const response = await axios
        .get(`${BASE_URL}/answer/${aiJobId}`, {
          headers: { Cookie: authCookie },
        })
        .catch((e) => e.response);

      console.log("AI Answer (initial poll):", response?.data);

      expect([200, 202]).toContain(response.status);
    });

    test("GET /answer/:jobId - should eventually return completed result", async () => {
      const MAX_RETRIES = 10;
      const RETRY_DELAY = 2000;

      let result = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const response = await axios
          .get(`${BASE_URL}/answer/${aiJobId}`, {
            headers: { Cookie: authCookie },
          })
          .catch((e) => e.response);

        if (response.status === 200) {
          result = response.data;
          break;
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }

      expect(result).toBeDefined();
      expect(result.data.status).not.toBe("processing");
    });

    test("GET /answer/:jobId - should return 404 for invalid jobId", async () => {
      const response = await axios
        .get(`${BASE_URL}/answer/invalid123`, {
          headers: { Cookie: authCookie },
        })
        .catch((e) => e.response);

      expect(response.status).toBe(404);
    });
  });

  // -------- OCR Tests --------
  {
    test("POST /extract/:userId - should accept image and return jobId", async () => {
      const form = new FormData();
      form.append("image", testImageBuffer, "prescription.jpg");
      form.append(
        "doctorInfo",
        JSON.stringify({ name: "Dr. Test", specialty: "General" })
      );

      const res = await axios
        .post(`${BASE_URL}/prescriptions/extract/${testUserId}`, form, {
          headers: { ...form.getHeaders(), Cookie: authCookie },
        })
        .catch((e) => e.response);

      expect(res.status).toBe(202);
      expect(res.data).toHaveProperty("code", "ACCEPTED");
      expect(res.data).toHaveProperty("status", 202);
      expect(res.data).toHaveProperty(
        "message",
        "Request accepted for processing."
      );
      expect(res.data.data).toHaveProperty("jobId");
      expect(res.data.data).toHaveProperty("status", "queued");

      ocrJobId = res.data.data.jobId;
    });

    test("GET /extract/status/:jobId - should eventually return 'completed'", async () => {
      if (!ocrJobId) return;

      const MAX_RETRIES = 8;
      const RETRY_DELAY = 3000;

      let result = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const res = await axios
          .get(`${BASE_URL}/prescriptions/extract/status/${ocrJobId}`, {
            headers: { Cookie: authCookie },
          })
          .catch((e) => e.response);

        if (res.data.data?.status === "completed") {
          result = res.data;
          break;
        }
        if (res.data.data?.status === "failed") {
          throw new Error(`OCR Job failed: ${res.data.data.error}`);
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
      }

      expect(result).toBeDefined();
      expect(result.data.status).toBe("completed");
      expect(result.data.result).toHaveProperty("id");
      expect(result.data.result.doctor).toBeTruthy();
      expect(Array.isArray(result.data.result.medicines)).toBe(true);
    });
  }
});
