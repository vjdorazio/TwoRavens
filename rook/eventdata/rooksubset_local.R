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
#       d. If Date field is string, run
#            db.samplePhox.find({}).forEach( function (x) { x.Date = parseInt(x.Date); db.samplePhox.save(x); });
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

eventdata_subset_local.app <- function(env) {
    production <- FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development

    if (production) {
        sink(file = stderr(), type = "output")
    }

    request <- Request$new(env)
    response <- Response$new()
    response$header("Access-Control-Allow-Origin", "*")  # Enable CORS

    print("Request received")

    if (request$options()) {
        print("Preflight")
        response$status = 200L


        # Ensures CORS header is permitted
        response$header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        response$header("Access-Control-Allow-Headers", "origin, content-type, accept")
        return(response$finish())
    }

    # Ensure solaJSON is posted
    solajson = request$POST()$solaJSON
    if (is.null(solajson)) {
        response$write('{"warning": "EventData R App is loaded, but no json sent. Please send solaJSON in the POST body."}')
        return(response$finish())
    }

    # Ensure that solaJSON is valid
    valid <- jsonlite::validate(solajson)
    if (!valid) {
        response$write('{"warning": "The request is not valid json. Check for special characters."}')
        return(response$finish())
    }

    everything <- jsonlite::fromJSON(request$POST()$solaJSON, simplifyDataFrame = FALSE)
    subsets = everything$subsets
    variables = everything$variables

    # raw: return query as is
    # summary: return metadata
    # actor: return actor filtering
    # validate: check if query is valid
    type = everything$type
    length = everything$length


    subsets = gsub('date8', 'Date', subsets)
    print(subsets)

    # print(subsets)
    # print(variables)
    table <- 'samplePhox'
    connection <- RMongo::mongoDbConnect('eventdata', '127.0.0.1', 27017)

    if (!is.null(type) && type == 'raw') {
        result = toString(jsonlite::toJSON(RMongo::dbGetQueryForKeys(connection, table, subsets, variables)))
        response$write(result)
        return(response$finish())
    }

    if (!is.null(type) && type == 'actor' && !is.null(length) && length > 0) {
        actor_source = head(sort(RMongo::dbGetDistinct(connection, table, 'Source', subsets)), n=length)
        actor_target = head(sort(RMongo::dbGetDistinct(connection, table, 'Target', subsets)), n=length)

        result = toString(jsonlite::toJSON(list(
            source = actor_source,
            target = actor_target
        )))

        response$write(result)
        return(response$finish())
    }

    if (!is.null(type) && type == 'validate') {

        handler = function(exc) {
            response$write(paste('{"response": "', toString(exc), '"}'))
        }

        tryCatch({
            RMongo::dbGetQuery(connection, table, subsets);
            response$write('{"response": "Query is valid."}')},
            warning = handler,
            error = handler
        )
        return(response$finish())
    }

    unique = function(values) {
        accumulator = list()
        for (key in values) {
            if (key != "") {

                for (elem in strsplit(key, ';')) {
                    if (!(elem %in% accumulator)) {
                        accumulator = c(accumulator, elem)
                    }
                }

            }
        }
        return(sort(unlist(accumulator)))
    }

    # Collect frequency data necessary for date plot
    date_frequencies = RMongo::dbAggregate(connection, table, c(
    paste('{$match: ', subsets, '}'),                                   # First, match based on data subset
    '{$project: {Year: "$Year", Month: "$Month", _id: 0}}',             # Cull to just Year and Month fields
    '{$group: { _id: { year: "$Year", month: "$Month" }, total: {$sum: 1} }}')) # Group by years and months

    # Collect frequency data necessary for country plot
    country_frequencies = RMongo::dbAggregate(connection, table, c(
    paste('{$match: ', subsets, '}'),                                   # First, match based on data subset
    '{$project: {ccode: "$CountryCode", _id: 0}}',                      # Cull to just CountryCode field
    '{$group: { _id: {CountryCode: "$ccode"}, total: {$sum:1}}}'))        # Compute frequencies of each bin

    # Collect frequency data necessary for action plot
    action_frequencies = RMongo::dbAggregate(connection, table, c(
    paste('{$match: ', subsets, '}'),                                   # First, match based on data subset
    '{$project: {rcode: "$RootCode", _id: 0}}',                         # Cull to just RootCode field
    '{$group: { _id: {RootCode: "$rcode"}, total: {$sum:1}}}'))          # Compute frequencies of each bin

    # Collect unique values for sources page
    actor_source = head(sort(RMongo::dbGetDistinct(connection, table, 'Source', subsets)), n=100)
    actor_source_entities = sort(RMongo::dbGetDistinct(connection, table, 'SrcActor', subsets))
    actor_source_role = sort(RMongo::dbGetDistinct(connection, table, 'SrcAgent', subsets))
    actor_source_attributes = unique(RMongo::dbGetDistinct(connection, table, 'SOthAgent', subsets))

    actor_source_values = list(
        full = actor_source,
        entities = actor_source_entities,
        roles = actor_source_role,
        attributes = actor_source_attributes
    )

    actor_target = head(sort(RMongo::dbGetDistinct(connection, table, 'Target', subsets)), n=100)
    actor_target_entities = sort(RMongo::dbGetDistinct(connection, table, 'TgtActor', subsets))
    actor_target_role = sort(RMongo::dbGetDistinct(connection, table, 'TgtAgent', subsets))
    actor_target_attributes = unique(RMongo::dbGetDistinct(connection, table, 'TOthAgent', subsets))

    actor_target_values = list(
        full = actor_target,
        entities = actor_target_entities,
        roles = actor_target_role,
        attributes = actor_target_attributes
    )

    # Package actor data
    actor_values = list(
        source = actor_source_values,
        target = actor_target_values
    )


    if (production) {
        sink()
    }
    result = toString(jsonlite::toJSON(list(
        date_data = date_frequencies,
        country_data = country_frequencies,
        action_data = action_frequencies,
        actor_data = actor_values
    )))
    response$write(result)
    return(response$finish())
}