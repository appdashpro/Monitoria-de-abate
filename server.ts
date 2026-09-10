import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { batches, evaluations, users } from "./src/db/schema.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST

  // API Route to sync user and return user id
  app.get("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const user = await getOrCreateUser(uid, email || "no-email@provided.com");
      res.json({ id: user.id });
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  app.get("/api/batches", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const allBatches = await db.select().from(batches).where(eq(batches.userId, user.id)).orderBy(desc(batches.date));
      res.json(allBatches);
    } catch (error: any) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ error: "Failed to fetch batches", details: error.toString() });
    }
  });

  app.post("/api/batches", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const newBatch = req.body;
      const result = await db.insert(batches).values({
        id: newBatch.id,
        userId: user.id,
        abattoir: newBatch.abattoir,
        farm: newBatch.farm,
        batchId: newBatch.batchId,
        totalAnimals: newBatch.totalAnimals,
        date: newBatch.date,
      }).onConflictDoUpdate({
        target: batches.id,
        set: {
          abattoir: newBatch.abattoir,
          farm: newBatch.farm,
          batchId: newBatch.batchId,
          totalAnimals: newBatch.totalAnimals,
        }
      }).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating batch:", error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.get("/api/batches/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const batchResult = await db.select().from(batches).where(eq(batches.id, req.params.id));
      if (batchResult.length === 0 || batchResult[0].userId !== user.id) {
        console.log("404 Batch not found for id:", req.params.id); console.log("404 Batch not found for batchId:", req.params.batchId, "user:", user.id); return res.status(404).json({ error: "Batch not found" });
      }
      res.json(batchResult[0]);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.delete("/api/batches/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      
      const batchResult = await db.select().from(batches).where(eq(batches.id, req.params.id));
      if (batchResult.length === 0 || batchResult[0].userId !== user.id) {
        return res.status(403).json({ error: "Forbidden: Not batch owner" });
      }

      await db.delete(evaluations).where(eq(evaluations.batchId, req.params.id));
      await db.delete(batches).where(eq(batches.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting batch:", error);
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  app.get("/api/evaluations/:batchId", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const batchResult = await db.select().from(batches).where(eq(batches.id, req.params.batchId));
      if (batchResult.length === 0 || batchResult[0].userId !== user.id) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const allEvaluations = await db.select().from(evaluations).where(eq(evaluations.batchId, req.params.batchId));
      res.json(allEvaluations);
    } catch (error: any) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ error: "Failed to fetch evaluations", details: error.toString() });
    }
  });

  app.post("/api/evaluations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const newEval = req.body;
      
      // Check batch owner
      const batchResult = await db.select().from(batches).where(eq(batches.id, newEval.batchId));
      if (batchResult.length === 0 || batchResult[0].userId !== user.id) {
        return res.status(403).json({ error: "Forbidden: Not batch owner" });
      }

      const evalId = newEval.id || crypto.randomUUID();

      const result = await db.insert(evaluations).values({
        id: evalId,
        batchId: newEval.batchId,
        animalIndex: newEval.animalIndex,
        rightCranial: newEval.rightCranial,
        rightMiddle: newEval.rightMiddle,
        rightCaudal: newEval.rightCaudal,
        accessory: newEval.accessory,
        leftCranial: newEval.leftCranial,
        leftMiddle: newEval.leftMiddle,
        leftCaudal: newEval.leftCaudal,
        scarring: newEval.scarring,
        pleurisy: newEval.pleurisy,
        spes: newEval.spes,
      }).onConflictDoUpdate({
        target: evaluations.id,
        set: {
          animalIndex: newEval.animalIndex,
          rightCranial: newEval.rightCranial,
          rightMiddle: newEval.rightMiddle,
          rightCaudal: newEval.rightCaudal,
          accessory: newEval.accessory,
          leftCranial: newEval.leftCranial,
          leftMiddle: newEval.leftMiddle,
          leftCaudal: newEval.leftCaudal,
          scarring: newEval.scarring,
          pleurisy: newEval.pleurisy,
          spes: newEval.spes,
        }
      }).returning();
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ error: "Failed to create evaluation" });
    }
  });

  app.delete("/api/evaluations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email || "");
      const evalResult = await db.select().from(evaluations).where(eq(evaluations.id, req.params.id));
      
      if (evalResult.length === 0) {
         return res.status(404).json({ error: "Evaluation not found" });
      }

      const batchResult = await db.select().from(batches).where(eq(batches.id, evalResult[0].batchId));
      if (batchResult.length === 0 || batchResult[0].userId !== user.id) {
         return res.status(403).json({ error: "Forbidden" });
      }

      await db.delete(evaluations).where(eq(evaluations.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting evaluation:", error);
      res.status(500).json({ error: "Failed to delete evaluation" });
    }
  });


  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.send(`
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(cacheNames.map((c) => caches.delete(c))))
    .then(() => self.clients.claim())
    .then(() => self.registration.unregister())
  );
});
self.addEventListener('fetch', (e) => {
  // Pass through
});
    `);
  });

  app.get('/registerSW.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.send(`
if('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) { registration.unregister(); }
  });
}
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
