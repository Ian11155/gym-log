import {
  clearLocalSquadData,
  createDefaultSquadData,
  exportLocalSquadData,
  loadLocalSquadData,
  parseLocalSquadBackup,
  saveLocalSquadData,
  SquadLocalData,
} from "../storage/localSquadStorage";

export const APP_BUILD_LABEL = "SquadLift PWA v0.0.0";

export const squadDataService = {
  load: loadLocalSquadData,
  save: saveLocalSquadData,
  exportBackup: exportLocalSquadData,
  importBackup: parseLocalSquadBackup,
  resetLocalData: clearLocalSquadData,
  createDefaultData: createDefaultSquadData,
};

export type { SquadLocalData };
