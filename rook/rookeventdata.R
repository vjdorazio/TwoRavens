##
##  rookeventdata.r
##

## LOCAL SETUP STEPS:
# 0. If on windows, use Ubuntu on a virtualbox to prevent this error:
#       Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/custom/eventdataapp. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing).
#
# 1. Install mongodb
# 
# 2. Start a mongo server. Server port is 27017 by default
#      sudo service mongod start
# 
# 3. Create a new database using the mongoimport utility in the mongo bin (via cmd from ~/TwoRavens/)
#      mongoimport -d eventdata -c samplePhox --type csv --file ./data/samplePhox.csv --headerline
#
#      3a. To check that the csv data is available, run in new CMD: 
#          (connects to mongo server on default port, opens mongo prompt)
#            mongo
#       b. Switch to eventdata database
#            use eventdata
#       c. Return all data from the samplePhox table
#            db.samplePhox.find()
# 
# 4. Start a local R server to make this file available here: (should prompt for solajson)
#      http://localhost:8000/custom/eventdataapp
#
#      4a. Install/run R, to enter R prompt
#       b. Run source('rooksource.R') to start R server
#          Note: Rook, the R package that runs the R server, does not seem to recognize file updates, 
#                so the server must be restarted after each edit. There should be a better way.
# 
# 5. Submit query from local python server via eventdata web gui. This script will return the subsetted data
#
# 6. Permit CORS on your browser. This doesn't seem to work on Windows
#      6a. Google Chrome: start with terminal argument
#             google-chrome --disable-web-security
#       b. Mozilla Firefox: in about:config settings
#             security.fileuri.strict_origin_policy - set to False

# NOTE: Use quit() to close the R server. Otherwise the ports will not correctly be released.
#       If you use Rstudio, modify the IDE config so that it won't share the same port as the R server

eventdata.app <- function(env) {
  production <- FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  
  if (production) {
    sink(file = stderr(), type = "output")
  }
  
  request <- Request$new(env)
  print("Request received")

  if (request$options()) {
    print("Preflight")
    response <- Response$new(status = 200L)
    response$header("Access-Control-Allow-Origin", "*")
    response$header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    response$header("Access-Control-Allow-Headers", "origin, content-type, accept")
    return(response$finish())
  }

  response <- Response$new(headers = list("Access-Control-Allow-Origin" = "*"))
  response$header("Access-Control-Allow-Origin", "*")
  
  solajson = request$POST()$solaJSON

  if (is.null(solajson)) {
    response$write('{"warning": "EventData R App is loaded, but no json sent. Please send solaJSON in the POST body."}')
    return(response$finish())
  }

  # Ensure that text is valid json
  valid <- jsonlite::validate(solajson)

  if (!valid) {
    response$write('{"warning": "The request is not valid json. Check for special characters."}')
    return(response$finish())
  }

  everything <- jsonlite::fromJSON(request$POST()$solaJSON)
  subsets = toString(jsonlite::toJSON(everything$subsets))
  variables = toString(jsonlite::toJSON(everything$variables))

  connection <- RMongo::mongoDbConnect('eventdata', '127.0.0.1', 27017)
  query <- RMongo::dbGetQueryForKeys(connection, 'samplePhox', subsets, variables)

  result <- jsonlite::toJSON(query)

  # Collect frequency data necessary for subset plot
  date_frequencies = RMongo::dbAggregate(connection, 'samplePhox', c(
    paste('{$match: ', subsets, '}'),
    '{$group: { _id: {month: "$Month",
                      year:  "$Year" },
                      total: {$sum:1}}}',
    '{$project : {month : "$_id.month", year : "$_id.year", total : "$total", _id : 0}}'))

  # Collect frequency data necessary for country plot
  country_frequencies = RMongo::dbAggregate(connection, 'samplePhox', c(
  paste('{$match: ', subsets, '}'),
  '{$group: { _id: {country: "$AdminInfo"}, country: {$sum:1}}}'))

  if (production) {
    sink()
  }
  result = toString(jsonlite::toJSON(list(date_data = date_frequencies, country_data = country_frequencies)))
  response$write(result)
  response$finish()
}
