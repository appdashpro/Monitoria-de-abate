export interface Batch {
  id: string;
  abattoir: string;
  farm: string;
  batchId: string;
  totalAnimals: number;
  date: number; // Timestamp
}

export interface AnimalEvaluation {
  id: string;
  batchId: string;
  animalIndex: number;
  rightCranial: number;
  rightMiddle: number;
  rightCaudal: number;
  accessory: number;
  leftCranial: number;
  leftMiddle: number;
  leftCaudal: number;
  scarring: boolean;
  pleurisy: boolean;
  spes: number;
}
