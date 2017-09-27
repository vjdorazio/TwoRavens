##
##  rookeventdata.r
##

# More general local setup instructions are available in the rooksubset_local file.

eventdata_subset.app <- function(env) {
    eventdata_url = 'http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6'
    production <- FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development

    SPEC_NAMES = c("GID","Date","Year","Month","Day","Source","SrcActor","SrcAgent","SOthAgent","Target","TgtActor",
    "TgtAgent","TOthAgent","CAMEO","RootCode","QuadClass","Goldstein","Lat","Lon","Geoname","CountryCode",
    "AdminInfo","ID","URL","sourcetxt")

    DATA_NAMES = c('event_id', 'date8', 'year', 'month', 'day',
    'source', 'src_actor', 'src_agent', 'src_other_agent',
    'target', 'tgt_actor', 'tgt_agent', 'tgt_other_agent',
    'code', 'root_code', 'quad_class', 'goldstein', 'latitude', 'longitude',
    'geoname', 'country_code', 'admin_info', 'id',  'url',
    'source_text')

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

    for (i in 1:length(SPEC_NAMES)) {
        subsets = gsub(SPEC_NAMES[[i]], DATA_NAMES[[i]], subsets)
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

    getData = function(url) {
        data = jsonlite::fromJSON(url)$data
        print(data)
        return(data)
    }

    # Check if metadata has already been computed, and return cached value if it has
    # if (!file.exists("./data/cachedQueries.RData")) save(list(0), file="./data/cachedQueries.RData")
    #
    # cachedQueries = load("./data/cachedQueries.RData")
    # if (subsets %in% cachedQueries) {
    #     response$write(getData(paste("./data/", match(subsets, cachedQueries)), ".txt"))$data
    #     return(response$finish())
    # }

    # This is a new query, so compute new metadata
    query_url = paste(eventdata_url, '&query=', subsets, sep="")
    # query_url = paste(query_url, '&select=', paste0(variables, collapse=','))

    print("Collecting date frequencies")
    date_frequencies = getData(paste(query_url, '&group=year,month', sep=""))

    print("Collecting country frequencies")
    country_frequencies = getData(paste(query_url, '&group=country_code', sep=""))

    print("Collecting action codes")
    action_code_frequencies = getData(paste(query_url, '&group=root_code', sep=""))

    print("Collecting pentaclass codes")
    action_class_frequencies = getData(paste(query_url, '&group=quad_class', sep=""))

    action_values = list(
        code_data = action_code_frequencies,
        class_data = action_class_frequencies
    )

    print("Collecting actor sources")
    actor_source = getData(paste(query_url, '&unique=source', sep=""))

    print("Collecting actor source entities")
    actor_source_entities = getData(paste(query_url, '&unique=src_actor', sep=""))

    print("Collecting actor source agents/roles")
    actor_source_role = getData(paste(query_url, '&unique=src_agent', sep=""))

    print("Collecting actor source other agents")
    actor_source_attributes = unique(jsonlite::fromJSON(paste(query_url, '&unique=src_other_agent', sep=""))$data)

    actor_source_values = list(
        full = actor_source,
        entities = actor_source_entities,
        roles = actor_source_role,
        attributes = actor_source_attributes
    )

    print("Collecting actor targets")
    actor_target = getData(paste(query_url, '&unique=target', sep=""))

    print("Collecting actor target entities")
    actor_target_entities = getData(paste(query_url, '&unique=tgt_actor', sep=""))

    print("Collecting actor target agents/roles")
    actor_target_role = getData(paste(query_url, '&unique=tgt_agent', sep=""))

    print("Collecting actor target other agents")
    actor_target_attributes = unique(jsonlite::fromJSON(paste(query_url, '&unique=tgt_other_agent', sep=""))$data)

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
        action_data = action_values,
        actor_data = actor_values
    )))

    print("Complete!")
    response$write(result)
    response$finish()
}
