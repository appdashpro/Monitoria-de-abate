import { db } from "./src/db/index.ts";
import { batches } from "./src/db/schema.ts";
async function test() {
  try {
    const res = await db.select().from(batches);
    console.log("Success:", res);
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}
test();
