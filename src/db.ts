import Dexie, { Table } from 'dexie';
import { Batch, AnimalEvaluation } from './types';

export class MonitoriaDB extends Dexie {
  batches!: Table<Batch, string>;
  evaluations!: Table<AnimalEvaluation, string>;

  constructor() {
    super('MonitoriaDB');
    this.version(1).stores({
      batches: 'id, userId, date',
      evaluations: 'id, batchId, [batchId+animalIndex]'
    });
    this.version(2).stores({
      batches: 'id, date',
      evaluations: 'id, batchId, [batchId+animalIndex]'
    }).upgrade(tx => {
      // no data migration needed
    });
  }
}

export const db = new MonitoriaDB();
