import Dexie from 'dexie';
const db = new Dexie('TestDB');
db.version(1).stores({
  evaluations: 'id, batchId, animalIndex'
});
try {
  await db.evaluations.put({ id: '1', batchId: 'b1', animalIndex: 1 });
  const val = await db.evaluations.get({ batchId: 'b1', animalIndex: 1 });
  console.log('Success:', val);
} catch (e) {
  console.error('Error:', e);
}
