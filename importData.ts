import { db } from './src/db/index.ts';
import { batches, evaluations, users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';

async function run() {
  const email = "rogerfrancescon@gmail.com";
  let user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    console.error("User not found!");
    process.exit(1);
  }
  const userId = user[0].id;

  const batchId = crypto.randomUUID();
  
  await db.insert(batches).values({
    id: batchId,
    userId: userId,
    abattoir: "Não Informado",
    farm: "Copagri",
    batchId: "Pesagem",
    totalAnimals: 162,
    date: new Date("2026-07-14").getTime()
  });

  const csv = fs.readFileSync('seed.csv', 'utf-8');
  const lines = csv.trim().split('\n').slice(1);
  
  const evals = lines.map(line => {
    const parts = line.split(',');
    // ID,Granja,Lote,Data,Cranial_Dir,Medio_Dir,Caudal_Dir,Acessorio,Cranial_Es,Medio_Es,Caudal_Es,Cicatrizacao,Pleurisia
    return {
      id: crypto.randomUUID(),
      batchId: batchId,
      animalIndex: parseInt(parts[0]),
      rightCranial: parseInt(parts[4]),
      rightMiddle: parseInt(parts[5]),
      rightCaudal: parseInt(parts[6]),
      accessory: parseInt(parts[7]),
      leftCranial: parseInt(parts[8]),
      leftMiddle: parseInt(parts[9]),
      leftCaudal: parseInt(parts[10]),
      scarring: parts[11].trim().toLowerCase() === 'sim',
      pleurisy: parts[12].trim().toLowerCase() === 'sim',
      spes: parts[12].trim().toLowerCase() === 'sim' ? 1 : 0 // Fallback based on pleurisy
    };
  });

  await db.insert(evaluations).values(evals);
  console.log("Imported successfully!");
  process.exit(0);
}

run().catch(console.error);
