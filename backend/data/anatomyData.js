'use strict';

/** EH anatomy chart — organs, systems, recommended medicine series */
const ANATOMY_MAP = {
  brain: {
    hindi: 'Mastishk (Brain)',
    system: 'NERVOUS',
    side: 'Center',
    pole: 'Mixed',
    series: ['F-1', 'WE', 'C-11']
  },
  eyes: {
    hindi: 'Aankhein (Eyes)',
    system: 'NERVOUS',
    side: 'Both',
    pole: 'Mixed',
    series: ['F-1', 'C-11']
  },
  throat: {
    hindi: 'Kanth (Throat)',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Negative',
    series: ['P-1', 'S-1', 'C-8']
  },
  lungs: {
    hindi: 'Phephde (Lungs)',
    system: 'LYMPHATIC',
    side: 'Both',
    pole: 'Negative',
    series: ['P-1', 'P-2', 'P-3', 'S-1']
  },
  heart: {
    hindi: 'Hriday (Heart)',
    system: 'SANGUINE',
    side: 'Left',
    pole: 'Positive',
    series: ['A-1', 'A-2', 'C-11']
  },
  stomach: {
    hindi: 'Pet (Stomach)',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Mixed',
    series: ['C-8', 'S-1', 'C-1']
  },
  liver: {
    hindi: 'Yakrit (Liver)',
    system: 'SANGUINE',
    side: 'Right',
    pole: 'Positive',
    series: ['S-2', 'C-8', 'A-1']
  },
  kidneys: {
    hindi: 'Gurda (Kidneys)',
    system: 'LYMPHATIC',
    side: 'Both',
    pole: 'Negative',
    series: ['S-6', 'C-5', 'C-11']
  },
  spleen: {
    hindi: 'Pliha (Spleen)',
    system: 'SANGUINE',
    side: 'Left',
    pole: 'Positive',
    series: ['S-1', 'C-1', 'A-2']
  },
  intestines: {
    hindi: 'Antri (Intestines)',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Mixed',
    series: ['C-8', 'S-1', 'C-3']
  },
  bladder: {
    hindi: 'Mutrashay (Bladder)',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Negative',
    series: ['S-6', 'C-5']
  },
  joints: {
    hindi: 'Jodon (Joints)',
    system: 'LYMPHATIC',
    side: 'Both',
    pole: 'Mixed',
    series: ['C-3', 'C-4', 'S-1']
  },
  legs: {
    hindi: 'Paire (Legs)',
    system: 'LYMPHATIC',
    side: 'Lower',
    pole: 'Negative',
    series: ['C-3', 'S-1', 'C-11']
  },
  neck_nodes: {
    hindi: 'Gardan ki granthiyan',
    system: 'LYMPHATIC',
    side: 'Neck',
    pole: 'Negative',
    series: ['S-1', 'S-3', 'C-11']
  },
  repro_male: {
    hindi: 'Purush jananang',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Mixed',
    series: ['C-5', 'S-6']
  },
  repro_female: {
    hindi: 'Mahila jananang',
    system: 'LYMPHATIC',
    side: 'Center',
    pole: 'Mixed',
    series: ['C-5', 'S-6', 'C-11']
  }
};

const SYMPTOM_TO_ORGAN = {
  bukhar: ['heart', 'liver', 'spleen'],
  fever: ['heart', 'liver', 'spleen'],
  garmi: ['heart', 'liver'],
  khansi: ['lungs', 'throat'],
  cough: ['lungs', 'throat'],
  saans: ['lungs', 'heart'],
  kidney: ['kidneys', 'bladder'],
  gurda: ['kidneys'],
  'kidney pain': ['kidneys'],
  peshab: ['kidneys', 'bladder'],
  creatinine: ['kidneys'],
  dard: ['joints', 'legs'],
  pain: ['joints'],
  sujan: ['joints', 'legs', 'neck_nodes'],
  swelling: ['joints', 'legs'],
  kamzori: ['heart', 'liver', 'spleen'],
  weakness: ['heart', 'liver'],
  thakan: ['heart', 'liver'],
  sir_dard: ['brain'],
  headache: ['brain'],
  pet: ['stomach', 'intestines', 'liver'],
  jaundice: ['liver'],
  diabetes: ['stomach', 'kidneys'],
  sugar: ['stomach', 'kidneys'],
  bp: ['heart', 'kidneys'],
  hypertension: ['heart', 'kidneys']
};

module.exports = { ANATOMY_MAP, SYMPTOM_TO_ORGAN };
