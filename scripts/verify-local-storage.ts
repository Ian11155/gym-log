import assert from "node:assert/strict";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const localStorageMock = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

const {
  createDefaultSquadData,
  exportLocalSquadData,
  loadLocalSquadData,
  parseLocalSquadBackup,
  saveLocalSquadData,
} = await import("../src/storage/localSquadStorage");

localStorageMock.clear();
const emptyLoad = loadLocalSquadData();
assert.equal(emptyLoad.source, "seed");
assert.equal(emptyLoad.data.activeUserId, "user-1");

const savedData = createDefaultSquadData();
savedData.activeUserId = "user-2";
savedData.workoutLogs = [];
saveLocalSquadData(savedData);

const snapshotLoad = loadLocalSquadData();
assert.equal(snapshotLoad.source, "snapshot");
assert.equal(snapshotLoad.data.activeUserId, "user-2");
assert.equal(snapshotLoad.data.workoutLogs.length, 0);

const exported = exportLocalSquadData(snapshotLoad.data);
const imported = parseLocalSquadBackup(exported);
assert.equal(imported.activeUserId, "user-2");
assert.equal(imported.workoutLogs.length, 0);

localStorageMock.setItem("squadlift_local_state_v1", "{not-json");
const corruptedLoad = loadLocalSquadData();
assert.equal(corruptedLoad.source, "seed");
assert.ok(corruptedLoad.warning);

localStorageMock.clear();
localStorageMock.setItem("squad_workout_logs", JSON.stringify([]));
const legacyLoad = loadLocalSquadData();
assert.equal(legacyLoad.source, "legacy");
assert.equal(legacyLoad.data.workoutLogs.length, 0);

console.log("local storage adapter checks passed");
