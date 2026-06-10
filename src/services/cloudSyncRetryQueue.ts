import { SquadLocalData } from "../storage/localSquadStorage";

const QUEUE_KEY = "squadlift_cloud_sync_retry_queue_v1";
const MAX_QUEUE_ITEMS = 3;

export interface CloudSyncRetryItem {
  id: string;
  reason: string;
  createdAt: string;
  attempts: number;
  lastError: string;
  data: SquadLocalData;
}

export function loadCloudSyncRetryQueue(): CloudSyncRetryItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRetryItem) : [];
  } catch {
    return [];
  }
}

export function enqueueCloudSyncRetry(data: SquadLocalData, reason: string, lastError: string) {
  const existingQueue = loadCloudSyncRetryQueue();
  const nextItem: CloudSyncRetryItem = {
    id: `sync-${Date.now()}`,
    reason,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError,
    data,
  };

  saveCloudSyncRetryQueue([...existingQueue, nextItem].slice(-MAX_QUEUE_ITEMS));
  return nextItem;
}

export function clearCloudSyncRetryQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function markLatestCloudSyncRetryAttempt(lastError: string) {
  const queue = loadCloudSyncRetryQueue();
  const latest = queue.at(-1);
  if (!latest) return [];

  const updatedQueue = [
    ...queue.slice(0, -1),
    {
      ...latest,
      attempts: latest.attempts + 1,
      lastError,
    },
  ];

  saveCloudSyncRetryQueue(updatedQueue);
  return updatedQueue;
}

function saveCloudSyncRetryQueue(queue: CloudSyncRetryItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function isRetryItem(value: unknown): value is CloudSyncRetryItem {
  const item = value as Partial<CloudSyncRetryItem>;
  return Boolean(
    item &&
    typeof item.id === "string" &&
    typeof item.reason === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.attempts === "number" &&
    typeof item.lastError === "string" &&
    item.data &&
    typeof item.data === "object"
  );
}
