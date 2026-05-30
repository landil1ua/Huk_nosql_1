use("spotify");

// Завдання 1. Топ-10 виконавців за середньою популярністю
print("=== Завдання 1. Топ-10 виконавців за середньою популярністю ===");
printjson(
  db.tracks.aggregate([
    { $unwind: "$artists" },
    {
      $group: {
        _id: "$artists",
        avg_popularity: { $avg: "$popularity" },
        tracks_cnt: { $sum: 1 }
      },
    },
    {
      $match: {
        tracks_cnt: { $gte: 5 }
      },
    },
    {
        $sort: { avg_popularity: -1 }
    },
    {
        $limit: 10
    },
    {
        $project: {
            _id: 0,
            artist_name: "$_id",
            avg_popularity: { $round: ["$avg_popularity", 1] },
            tracks_cnt: 1
        }
    }
  ]),
);

// Завдання 2. Розподіл треків за настроєм
print("\n=== Завдання 2. Розподіл треків за настроєм ===");
printjson(
  db.tracks.aggregate([
    {
      $addFields: {
        mood: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $gt: ["$audio_features.valence", 0.5] },
                    { $gt: ["$audio_features.energy", 0.5] }
                  ]
                },
                then: "happy"
              },
              {
                case: {
                  $and: [
                    { $lt: ["$audio_features.valence", 0.5] },
                    { $gt: ["$audio_features.energy", 0.5] }
                  ]
                },
                then: "angry"
              },
              {
                case: {
                  $and: [
                    { $gt: ["$audio_features.valence", 0.5] },
                    { $lt: ["$audio_features.energy", 0.5] }
                  ]
                },
                then: "calm"
              }
            ],
            default: "sad"
          }
        }
      }
    },
    {
      $group: {
        _id: "$mood",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $project: {
        _id: 0,
        mood: "$_id",
        count: 1
      }
    }
  ])
);

// Завдання 3. Найбільш «танцювальний» жанр
print("\n=== Завдання 3. Найбільш «танцювальний» жанр ===");
printjson(
  db.tracks.aggregate([
    {
      $group: {
        _id: "$track_genre",
        avg_danceability: { $avg: "$audio_features.danceability" },
        avg_energy: { $avg: "$audio_features.energy" },
        avg_valence: { $avg: "$audio_features.valence" },
        tracks_cnt: { $sum: 1 },
      },
    },
    {
      $match: {
        tracks_cnt: { $gte: 100 },
      },
    },
    {
      $sort: { avg_danceability: -1 },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        _id: 0,
        genre: "$_id",
        avg_danceability: { $round: ["$avg_danceability", 3] },
        avg_energy: { $round: ["$avg_energy", 3] },
        avg_valence: { $round: ["$avg_valence", 3] },
        tracks_cnt: 1,
      },
    },
  ]),
);
