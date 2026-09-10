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
  }
}

export const db = new MonitoriaDB();
