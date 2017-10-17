let sampleQuery = `{
  "$or": [
    {
      "$and": [
        {
          "$and": [
            {
              "CountryCode": {
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
              "RootCode": {
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
              "Lat": {
                "$lte": 2.872,
                "$gte": -79.809
              }
            },
            {
              "Lon": {
                "$lte": -13.844,
                "$gte": -48.572
              }
            }
          ]
        },
        {
          "Date": {
            "$gte": 20150300,
            "$lte": 20160306
          }
        }
      ]
    }
  ]
}`;
