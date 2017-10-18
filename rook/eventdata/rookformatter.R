##
##  rookvalidator.r
##

validate = function(jsonData, format) {
    warnings = list();

    jsonFormat = jsonlite::fromJSON(readLines(paste("./eventdata/formats/", format, '.json', sep="")));

    for (keyFormat in jsonFormat) {
        fieldName = keyFormat$name

        # print(fieldName)
        # print(toString(jsonData[1,fieldName]))

        logicals = grepl(keyFormat$format, jsonData[,fieldName], perl=TRUE)
        accuracy = sum(logicals) / length(jsonData[,fieldName])

        if (accuracy < 100) {
            warnings[[fieldName]] = accuracy;
        }
    }
    print(warnings);

    return(warnings);
}

format = function(jsonObject, format) {
    # Not implemented. Applies a transform function loaded from the formats json to each element.
}
