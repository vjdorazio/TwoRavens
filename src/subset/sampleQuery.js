let sampleQuery = `{
  "$or": [
    {
      "$and": [
        {
          "$and": [
            {
              "<country_code>": {
                "$in": [
                  "BHR",
                  "ARM",
                  "ARE",
                  "OMN",
                  "YEM",
                  "AZE",
                  "SAU",
                  "SYR",
                  "TUR",
                  "IRQ",
                  "QAT",
                  "PSE",
                  "CYP",
                  "ISR",
                  "GEO",
                  "JOR",
                  "LBN",
                  "KWT",
                  "UKR",
                  "CZE",
                  "RUS"
                ]
              }
            },
            {
              "<root_code>": {
                "$in": [
                  10,
                  11,
                  12,
                  16,
                  6,
                  7,
                  8,
                  9
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "$and": [
        {
          "$and": [
            {
              "<latitude>": {
                "$lte": 2.872,
                "$gte": -79.809
              }
            },
            {
              "<longitude>": {
                "$lte": -13.844,
                "$gte": -48.572
              }
            }
          ]
        },
        {
          "<date>": {
            "$gte": 20150300,
            "$lte": 20160306
          }
        }
      ]
    }
  ]
}`;
