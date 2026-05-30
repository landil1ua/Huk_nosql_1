use("spotify");

// Хелпер для безпечного видалення індексу
function dropIndexSafe(collection, index) {
  try {
    collection.dropIndex(index);
  } catch (e) {
    print("Index not found, skipping drop...");
  }
}

// Завдання 1. Аналіз запиту та індексація

// Спочатку видаляємо індекс якщо він вже існує
// щоб кожен запуск скрипту був ідемпотентним
dropIndexSafe
dropIndexSafe(db.tracks, {
  track_genre: 1,
  "audio_features.danceability": 1,
  popularity: -1
});


print("=== Завдання 1. BEFORE index ===");
const beforeIndex = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("Stage:", beforeIndex.queryPlanner.winningPlan.stage);
print("Docs examined:", beforeIndex.executionStats.totalDocsExamined);
print("Docs returned:", beforeIndex.executionStats.totalDocsReturned);

// --- Створюємо індекс ---
db.tracks.createIndex({
  track_genre: 1,
  popularity: -1,
  "audio_features.danceability": 1,
});

print("\n=== Завдання 1. AFTER index ===");
const afterIndex = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("Stage:", afterIndex.queryPlanner.winningPlan.stage);
print("Docs examined:", afterIndex.executionStats.totalDocsExamined);
print("Docs returned:", afterIndex.executionStats.totalDocsReturned);

// Завдання 2.  Індекс для інших полів
// Спочатку видаляємо індекс якщо він вже існує
// щоб кожен запуск скрипту був ідемпотентним
dropIndexSafe(db.tracks, {
  explicit: 1,
  "audio_features.instrumentalness": 1,
  "audio_features.speechiness": 1,
});

print("\n=== Завдання 2. BEFORE index ===");
const beforeIndex2 = db.tracks
  .find({
    "audio_features.instrumentalness": { $gte: 0.5 },
    "audio_features.speechiness": { $lte: 0.3 },
    explicit: false,
  })
  .explain("executionStats");

print("Stage:", beforeIndex2.queryPlanner.winningPlan.stage);
print("Docs examined:", beforeIndex2.executionStats.totalDocsExamined);
print("Docs returned:", beforeIndex2.executionStats.totalDocsReturned);

// --- Створюємо індекс ---
db.tracks.createIndex({
  explicit: 1,
  "audio_features.instrumentalness": 1,
  "audio_features.speechiness": 1,
});

print("\n=== Завдання 2. AFTER index ===");
const afterIndex2 = db.tracks
  .find({
    "audio_features.instrumentalness": { $gte: 0.5 },
    "audio_features.speechiness": { $lte: 0.3 },
    explicit: false,
  })
  .explain("executionStats");

print("Stage:", afterIndex2.queryPlanner.winningPlan.stage);
print("Docs examined:", afterIndex2.executionStats.totalDocsExamined);
print("Docs returned:", afterIndex2.executionStats.totalDocsReturned);


// Завдання 3. Покривний запит
// Без проєкції — НЕ covered (FETCH)
print("\n=== Завдання 3. WITHOUT projection (not covered) ===");
const notCovered = db.tracks.find(
  {
    track_genre: "pop",
    popularity: { $gte: 70 }
  }
).explain("executionStats");

print("Stage:", notCovered.queryPlanner.winningPlan.stage);
print("Docs examined:", notCovered.executionStats.totalDocsExamined);

// З проєкцією — covered query (IXSCAN без FETCH)
print("\n=== Завдання 3. WITH projection (covered) ===");
const covered = db.tracks.find(
  {
    track_genre: "pop",
    popularity: { $gte: 70 }
  },
  {
    track_genre: 1,
    popularity: 1,
    _id: 0
  }
).explain("executionStats");

print("Stage:", covered.queryPlanner.winningPlan.stage);
print("Docs examined:", covered.executionStats.totalDocsExamined);