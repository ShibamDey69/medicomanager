// src/tests/api.test.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api"; // adjust port if needed

let testUserId = "testUserId123";
let prescriptionId;
let medicineId;
let authCookie; // store login cookie

describe("API End-to-End Tests with manual cookie", () => {
  // -------- Login Route --------
  test("POST /users/login - should return auth data and set cookie", async () => {
    const payload = {
      idToken:
        "eyJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWVpY28tOTA5OTkiLCJhdWQiOiJtZWljby05MDk5OSIsImF1dGhfdGltZSI6MTc1ODEzOTYxNSwidXNlcl9pZCI6IlNKNktRdjNYcG5PUkwwVEZIQTA5NDJHMkRDdzEiLCJzdWIiOiJTSjZLUXYzWHBuT1JMMFRGSEEwOTQyRzJEQ3cxIiwiaWF0IjoxNzU4MTM5NjE1LCJleHAiOjE3NTgxNDMyMTUsInBob25lX251bWJlciI6Iis5MTcwNDc1ODQ3NDEiLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7InBob25lIjpbIis5MTcwNDc1ODQ3NDEiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwaG9uZSJ9fQ.bJn2wDrV7T5uvNP6B7GahzUPTe5hncVP8EQMRn6WK4uP8k6kyAQvq1UDSDtn_XGX4QZJPRkGqujWkJwFmaTlloH1NoF5wIV211SJPMuc7nVpl2rEDQWbCPcSCNv9CemUyA7JQC4kNXQZLdpFtOyKt4z7bHIW53rU16mqKnDbrt9fAw3y4QtY_KUh9lMO3IOBPzVOICcAvKR5dRlP8pPTRIcuMwlh1e5YViFsONCfUAsIVSVZ0r6uBuQDpOcOkWAe9XETjRWeSkCVUh0Rg-NZwvMjHNWaXVSciiRtl3mWq7dg64v-OtuCFn9DnTDeudMnMKSH1QhgsG2oDGF7y-XT4w",
    };
    const response = await axios
      .post(`${BASE_URL}/users/login`, payload)
      .catch((e) => e.response);
    console.log("login", response.data);
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
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
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.data.data.frequency).toBe("2/day");
  });

  test("GET /users/:id - should return user profile", async () => {
    const response = await axios
      .get(`${BASE_URL}/users/${testUserId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);
    console.log("get user", response.data.data);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("data");
  });

  test("DELETE /medicines/:id - delete medicine", async () => {
    const response = await axios
      .delete(`${BASE_URL}/medicines/${medicineId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);
    console.log("delete medicine", response.data);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  test("DELETE /prescriptions/:id - delete prescription", async () => {
    const response = await axios
      .delete(`${BASE_URL}/prescriptions/${prescriptionId}`, {
        headers: { Cookie: authCookie },
      })
      .catch((e) => e.response);
    console.log("delete prescription", response.data);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});
