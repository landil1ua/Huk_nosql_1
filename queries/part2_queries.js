use("spotify");

// Завдання 1. Треки для вечірки
print("=== Завдання 1. Треки для вечірки ===");
printjson(
  db.tracks.find(
    {
      "audio_features.energy": { $gt: 0.7 },
      "duration_ms": { $gte: 180000, $lte: 300000 },
         "audio_features.danceability": { $gt: 0.7 },
         "audio_features.energy": { $gt: 0.7 },
    },
    {
        track_name: 1,
        artists: 1,
        duration_ms: 1,
        "audio_features.danceability": 1,
        "audio_features.energy": 1,
        _id: 0
    }
  ).limit(3).toArray()
);

// Завдання 2. Виконавці, у яких усі треки популярні
print("\n=== Завдання 2. Виконавці, у яких усі треки популярні ===");
printjson(
  db.tracks.aggregate([
    { $unwind: "$artists" },
    {
      $group: {
        _id: "$artists",
        tracks_cnt: { $sum: 1 },
        min_popularity: { $min: "$popularity" },
        avg_popularity: { $avg: "$popularity" }
      },
    },
    {
      $match: {
        min_popularity: { $gte: 60 },
        tracks_cnt: { $gte: 3 }
      },
    },
    {
        $sort: { avg_popularity: -1 }
    },
    {
        $limit: 20
    },
    {
        $project: {
            _id: 0,
            artist_name: "$_id",
            tracks_cnt: 1,
            min_popularity: 1,
            avg_popularity: { $round: ["$avg_popularity", 1] }
        }
    }
  ]),
);

// Завдання 3. Нетипові треки
print("\n=== Завдання 3. Нетипові треки ===");
printjson(
  db.tracks.aggregate([
    {
        $group: {
            _id: "$track_genre",
            avg_tempo: { $avg: "$audio_features.tempo" },
            stddev_tempo: { $stdDevPop : "$audio_features.tempo" },
            tracks: {
                $push: {
                    id: "$_id",
                    track_name: "$track_name",
                    artists: "$artists",
                    popularity: "$popularity",
                    tempo: "$audio_features.tempo"
                }
            }
        },
    },
    {
        $addFields: {
            outlier_threshold: { $add: ["$avg_tempo", { $multiply: [2, "$stddev_tempo"] }] }
        }
    },
    {
        $addFields: {
            outlier_tracks: {
                $filter: {
                    input: "$tracks",
                    as: "track",
                    cond: { $gt: ["$$track.tempo", "$outlier_threshold"] }
                }
            }
        }
    },
    {
        $match: {
            "outlier_tracks.0": { $exists: true }
        }
    },
    {
        $limit: 5 // Показуємо не більше 5 жанрів з нетиповими треками
    },
    {
        $project: {
            _id: 0,
            avg_tempo: { $round: ["$avg_tempo", 0] },
            genre: "$_id",
            outlier_threshold: { $round: ["$outlier_threshold", 1] },
            outlier_tracks: { $slice: ["$outlier_tracks", 3] } // Показуємо не більше 3 треків на жанр
        }
    }
  ])
);

// Завдання 4. Треки для фонової роботи
print("\n=== Завдання 4. Треки для фонової роботи ===");
printjson(
  db.tracks.find(
    {
      "audio_features.loudness": { $lt: -10 },
      "audio_features.speechiness": { $lt: 0.1 },
      "audio_features.instrumentalness": { $gt: 0.5 },
        "explicit": false
    },
    {
        track_name: 1,
        artists: 1,
        "audio_features.loudness": 1,
        "audio_features.speechiness": 1,
        "audio_features.instrumentalness": 1,
        "explicit": 1,
        _id: 0
    }
  ).limit(3).toArray()
);
