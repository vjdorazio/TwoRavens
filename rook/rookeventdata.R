##
##  rookeventdata.r
##

## LOCAL SETUP STEPS:
# 0. If on windows, use Ubuntu on a virtualbox to prevent this error:
#       Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/custom/eventdataapp. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing).
#
# 1. Install mongodb
# 
# 2. Start a mongo server. May need to create C://data/db. Server port is 27017 by default
#      mongod
# 
# 3. Create a new database using the mongoimport utility in the mongo bin (via cmd from ~/TwoRavens/)
#      mongoimport -d eventdata -c samplePhox --type csv --file ./data/samplePhox.csv --headerline
#
#      3a. To check that the csv data is available, run in new CMD: 
#          (connects to mongo server on default port, opens mongo prompt)
#            mongo
#        b. Switch to eventdata database
#            use eventdata
#        c. Return all data from the samplePhox table
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

eventdata.app <- function(env) {
  production <- FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  warning <- FALSE
  result <- list()
  
  if (production) {
    sink(file = stderr(), type = "output")
  }
  
  request <- Request$new(env)
  
  if (request$options()) {
    response <- Response$new(status = 200)
    response$header("Access-Control-Allow-Origin", "*")
    response$header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    response$header("Access-Control-Allow-Headers", "origin, content-type, accept")
    response$finish()
    return()
  }
  response <- Response$new(headers = list("Access-Control-Allow-Origin" = "*"))
  
  solajson = request$POST()$solaJSON
  if (is.null(solajson)) {
    warning <- TRUE
    result <- "EventData R App is loaded, but no json sent. Please send solaJSON in the POST body."
  }
  
  valid <- jsonlite::validate(solajson)
  if (!valid) {
    warning <- TRUE
    result <- list(warning = "The request is not valid json. Check for special characters.")
  }
  
  if (!warning) {
    everything <- jsonlite::fromJSON(request$POST()$solaJSON)
    subsets = everything$subsets
    variables = everything$variables
    
    cursor <- RMongo:::mongoDbConnect('eventdata', 'localhost', 27017)
    query <- RMongo:::dbGetQueryForKeys(cursor, 'eventdata', subsets, variables)
    
    summary(query)
    result <- jsonlite:::toJSON(query)
  }
  
  if (production) {
    sink()
  }
  
  response$headers("localhost:8888")
  
  response$write(result)
  response$finish()
  
}
