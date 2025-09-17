import http from "http";
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT,"0.0.0.0", () => {
  console.log(`Backend is running on PORT: ${PORT}`);
});
