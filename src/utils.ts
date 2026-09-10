import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimalEvaluation } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LOBE_WEIGHTS = {
  rightCranial: 10,
  rightMiddle: 10,
  rightCaudal: 25,
  accessory: 10,
  leftCranial: 10,
  leftMiddle: 10,
  leftCaudal: 25,
};

export const PIFFER_BRITO_WEIGHTS = {
  rightCranial: 11, // Apical direito (AD)
  rightMiddle: 11,  // Cardíaco direito (CD)
  rightCaudal: 34,  // Diafragmático direito (DD)
  accessory: 5,     // Intermediário (I)
  leftCranial: 6,   // Apical esquerdo (AE)
  leftMiddle: 6,    // Cardíaco esquerdo (CE)
  leftCaudal: 27,   // Diafragmático esquerdo (DE)
};

export const IPP_WEIGHTS = {
  leftCranial: { 0: 0, 1: 0.7, 2: 2.3, 3: 3.8, 4: 5.3 },   // AE
  leftMiddle: { 0: 0, 1: 0.7, 2: 2.3, 3: 3.8, 4: 5.3 },    // CE
  leftCaudal: { 0: 0, 1: 3.4, 2: 10.1, 3: 17.0, 4: 23.8 }, // DE
  rightCranial: { 0: 0, 1: 1.4, 2: 4.1, 3: 6.9, 4: 9.7 },  // AD
  rightMiddle: { 0: 0, 1: 1.4, 2: 4.1, 3: 6.9, 4: 9.7 },   // CD
  rightCaudal: { 0: 0, 1: 4.3, 2: 12.7, 3: 21.4, 4: 29.9 },// DD
  accessory: { 0: 0, 1: 0.6, 2: 1.9, 3: 3.1, 4: 4.4 }      // I
} as const;

export function calculateAnimalStats(evaluation: Partial<AnimalEvaluation>) {
  const lobes = [
    'rightCranial',
    'rightMiddle',
    'rightCaudal',
    'accessory',
    'leftCranial',
    'leftMiddle',
    'leftCaudal',
  ] as const;

  let totalScore = 0;
  let areaAffected = 0;
  let areaAffectedPiffer = 0;
  let ippScore = 0;

  for (const lobe of lobes) {
    const score = evaluation[lobe] || 0;
    totalScore += score;
    areaAffected += (score / 4) * LOBE_WEIGHTS[lobe];
    areaAffectedPiffer += (score / 4) * PIFFER_BRITO_WEIGHTS[lobe];
    ippScore += IPP_WEIGHTS[lobe][score as 0|1|2|3|4] || 0;
  }

  const spes = evaluation.spes || 0;
  // APPI (APP Index) only considers SPES scores of 2, 3, and 4.
  const appi = spes >= 2 ? spes : 0;

  return {
    totalScore,
    areaAffected,
    areaAffectedPiffer,
    ippScore,
    spes,
    appi
  };
}

export function getEPIndexClassification(epIndex: number) {
  if (epIndex <= 1.49) return 'Leve';
  if (epIndex <= 2.4) return 'Intermediário';
  return 'Grave';
}

export function getAPIndexClassification(apIndex: number) {
  if (apIndex < 0.3) return 'Leve';
  if (apIndex <= 0.6) return 'Intermediário';
  return 'Grave';
}

export function getIPCategory(areaAffected: number): number {
  if (areaAffected === 0) return 0;
  if (areaAffected < 19.5) return 1;
  if (areaAffected < 32.5) return 2;
  if (areaAffected < 46.5) return 3;
  if (areaAffected < 58.5) return 4;
  if (areaAffected < 71.5) return 5;
  return 6;
}

export function getIPInterpretation(ip: number) {
  if (ip <= 0.55) return 'Aceitável (Ideal)';
  if (ip <= 0.65) return 'Aceitável (Margem de segurança)';
  if (ip <= 0.89) return 'Atenção';
  return 'Grave (Situação complicada)';
}

export function getClassificationColor(classification: string) {
  switch (classification) {
    case 'Leve':
    case 'Aceitável (Ideal)':
      return 'text-emerald-400';
    case 'Intermediário':
    case 'Aceitável (Margem de segurança)':
      return 'text-amber-400';
    case 'Atenção':
      return 'text-orange-500';
    case 'Grave':
    case 'Grave (Situação complicada)':
      return 'text-red-400';
    default: return 'text-slate-400';
  }
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
