import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from "ioredis";
import { Queue, Worker } from "bullmq";

export class MedicalAssistantController {
  constructor(apiKey, redisOptions = {}) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.redis = new Redis(redisOptions);
    this.queue = new Queue("medical-assistant", { connection: this.redis });

    this.worker = new Worker(
      "medical-assistant",
      async (job) => {
        const { userData, question, jobId } = job.data;
        const result = await this.processMedicalQuery(userData, question);

        await this.redis.setex(
          `result:${jobId}`,
          3600,
          JSON.stringify({
            status: "completed",
            result: result,
            timestamp: new Date().toISOString(),
          })
        );

        return result;
      },
      { connection: this.redis }
    );
  }

  createMedicalPrompt(userData, question) {
    const { user, prescriptions = [] } = userData;
    const age = user.DOB
      ? Math.floor(
          (new Date() - new Date(user.DOB)) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : "unknown";

    const medicalContext = {
      name: user.name,
      age: age,
      gender: user.gender || "not specified",
      bloodGroup: user.bloodGroup || "not specified",
      chronicDiseases: user.chronicDiseases || "none reported",
      allergies: user.allergies || "none reported",
      familialIssues: user.familialIssues || "none reported",
    };

    let prescriptionsInfo = "No prescriptions found.";
    if (prescriptions.length > 0) {
      prescriptionsInfo = "Current Prescriptions:\n";
      prescriptions.forEach((prescription, index) => {
        prescriptionsInfo += `${index + 1}. Doctor: ${prescription.doctor} (${
          prescription.specialty
        })\n`;
        prescriptionsInfo += `   Date: ${new Date(
          prescription.date
        ).toLocaleDateString()}\n`;
        prescriptionsInfo += `   Status: ${prescription.status}\n`;
        if (prescription.medicines && prescription.medicines.length > 0) {
          prescriptionsInfo += `   Medicines:\n`;
          prescription.medicines.forEach((med, medIndex) => {
            prescriptionsInfo += `     - ${med.name || "Unknown"} (${
              med.dosage || "N/A"
            })\n`;
          });
        }
        prescriptionsInfo += "\n";
      });
    }

    return `
You are a medical assistant providing personalized health advice. Use the following patient information:

Patient Profile:
- Name: ${medicalContext.name}
- Age: ${medicalContext.age} years
- Gender: ${medicalContext.gender}
- Blood Group: ${medicalContext.bloodGroup}

Medical History:
- Chronic Diseases: ${medicalContext.chronicDiseases}
- Allergies: ${medicalContext.allergies}
- Family Medical History: ${medicalContext.familialIssues}

${prescriptionsInfo}

Question: "${question}"

Provide a detailed, personalized medical response considering:
1. The patient's medical history
2. Current prescriptions and potential interactions
3. Age and gender-specific considerations
4. Blood group implications if relevant
5. Any potential drug interactions or contraindications
6. When to seek professional medical care

Important Guidelines:
- Do not diagnose conditions
- Recommend consulting healthcare professionals for serious concerns
- Provide evidence-based general medical information
- Avoid making absolute statements about treatments
- Highlight when immediate medical attention is needed
- Keep responses clear and jargon-free
- Consider current medications in your advice

Response:
`;
  }

  async processMedicalQuery(userData, question) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const prompt = this.createMedicalPrompt(userData, question);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        const isRateLimited =
          error.message.includes("429") || error.message.includes("quota");

        if (isRateLimited && attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          console.warn(
            `Rate limited. Retrying in ${delay}ms... (attempt ${attempt}/${MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        console.error("Error generating medical response:", error);
        throw new Error("Failed to get medical assistance after retries");
      }
    }
  }

  async submitQuery(userData, question) {
    const jobId = `medical_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await this.queue.add(
      "medical-query",
      {
        userData,
        question,
        jobId,
      },
      {
        jobId: jobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );

    await this.redis.setex(
      `result:${jobId}`,
      3600,
      JSON.stringify({
        status: "processing",
        timestamp: new Date().toISOString(),
      })
    );

    return jobId;
  }

  async getQueryResult(jobId) {
    const result = await this.redis.get(`result:${jobId}`);
    return result ? JSON.parse(result) : null;
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

export default MedicalAssistantController;
