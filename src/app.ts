import app from "./server/server";
import "dotenv/config";
import { connectionToDatabase } from "./config/db.config";

const port = process.env.PORT ?? 3000;

connectionToDatabase()

app.listen(port, () => {
  console.log(`Server listen port:${port}`);
});
