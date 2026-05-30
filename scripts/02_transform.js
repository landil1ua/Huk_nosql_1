// scripts/02_transform.js
// Запуск: mongosh "URI" --file scripts/02_transform.js

// Перемикання на базу spotify
use("spotify");

// Видаляємо колекцію tracks, якщо вона існує, щоб уникнути помилок при створенні нової
db.tracks.drop();

db.tracks_raw.aggregate([
  {
    $project: {
      _id: 0,
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      artists_raw: "$artists",
      audio_features: {
            danceability: "$danceability",
            energy: "$energy",
            loudness: "$loudness",
            speechiness: "$speechiness",
            acousticness: "$acousticness",
            instrumentalness: "$instrumentalness",
            liveness: "$liveness",
            valence: "$valence",
            tempo: "$tempo",
            key: "$key",
            mode: "$mode",
            time_signature: "$time_signature"
      },
    }
  },
  {
    $addFields: {
        artists: {
            $map: {
                input: { $split: ["$artists_raw", ";"] },
                as: "artist",
                in: { $trim: { input: "$$artist" } }
            }
        },
      duration_sec: { $round: [{ $divide: ["$duration_ms", 1000] }, 1] },
        popularity_tier: {
            $switch: {
                branches: [
                    { case: { $gte: ["$popularity", 70] }, then: "high" },
                    { case: { $and: [{ $gte: ["$popularity", 40] }, { $lt: ["$popularity", 70] }] }, then: "medium" },
                ],
                default: "low"
            }
        }
    }
  },
  {
    $unset: "artists_raw"
  },
  {
    $out: "tracks"
  }
]);

// Перевіряємо результат
print("Документів у tracks:", db.tracks.countDocuments({}));
printjson(db.tracks.findOne());