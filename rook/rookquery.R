##
##  querydata.R
##
##  8/4/15
##
library(jsonlite)
#library(RJSONIO)
query.app<-function(env){
  
  
  production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  warning<-FALSE
  
  if(production){
    sink(file = stderr(), type = "output")
  }
  request <- Request$new(env)
  
  #This header enables cross domain data transfer
  response <- Response$new(headers = list( "Access-Control-Allow-Origin"="*"))
  result <- list()
  print(request$POST()$solaJSON)

    #check whether the incoming JSON data is in valid format or not
    valid <- jsonlite::validate(request$POST()$solaJSON)
  if(!valid) {
    warning <- TRUE
    result <- list(warning="The request is not valid json. Check for special characters.")
  }


  if(!warning) {
    everything <- request$POST()$solaJSON
    print("value of Everything")
    print(everything)
  }
  
  #################################################################
  #################################################################
  ##################################################################
  #temp2 converts the incoming json data into list, by using fromJSON function of either rjson or jsonlite library 
  temp2=rjson::fromJSON(everything)
  
  type=temp2$type
  #checks for type sent by javascript. if prequery, populate lists
  if(type=="prequery"){
  
    #REST url calls for all 4 lists f=to be populated
    preurl=c("http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=src_actor",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=tgt_actor",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=date8",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=country_code")
    
  

  
  
  
 
  
  #populating and sorting the source actors list
  sourc<<-sort((jsonlite::fromJSON(preurl[1]))$data,decreasing = FALSE)
  
  #populating and sorting the target actors list
  target<<-sort((jsonlite::fromJSON(preurl[2]))$data,decreasing=FALSE)
  
  #populate and sort the locations
  location=sort((jsonlite::fromJSON(preurl[4]))$data,decreasing=FALSE)
  
  #populate the date list. But, we only need the max date and min date from the returned list
  date=jsonlite::fromJSON(preurl[3])$data
  
  #convert yyyymmdd into YYYY mm dd
  datetest=as.Date(date,"%Y%m%d")
  
  #sort the list
  datesort=sort(datetest)
  
  #save the max date
  maxdate=datesort[which.max(datesort)]
  
  #save the min date
  mindate=datesort[which.min(datesort)]
  
  #create the list of all lists, and convert into json data
  jsondata=jsonlite::toJSON(list(maxdate=maxdate,mindate=mindate,location=location,sourceactors=sourc,targetactors=target))
  
  #store jsondata into list to be sent to jsvascript
  result=list(jsondata)
  }
  #################################################################
  #################################################################
  ##################################################################
  
  
  
  #if type is postquery
  else{
  
  #this is done to remove the first and last {} because that is an extar set of brackets  
  tmp1=substr(everything,2,(nchar(everything)-1))
  
  #the query is extarcted from the list made above
  query=temp2$query

    #convert query into json format to be appended int the url
    json2=jsonlite::toJSON(query)
    #print("value of json2")
    #print(json2)
    
   #relace the spaces with %20  
   json3=gsub(" ","%20",json2)
   
   #the next three lines are used to remove the square brackets from the data json value. When the date is sent to R, it is sent as a json list, enclosed in []
   #but this needs to be removed in order for the query to work
   xx <- unlist(strsplit(json3,""))
   xx[c(18,29,38,49)] <- c("", "", "","")
   json3=paste0(xx,collapse='')
   
   
   #this are test queries and test URLs for you to try when you are testing this code. just uncomment any of these, and replce the relavent variables to see the results.
  #json3='{"date8":{"$gte":"[19700101]","$lte":"[20161231]"},"country_code":{"$in":["Ahal","West%20Bank"]}}'
  #'{"date8":{"$gte":"20070101","$lte":"20101231"},"country_code":{"$in":["Beijing%Shi","Illinois"]},"source":{"$in":["SAUGOV","INDGOV"]},"target":{"$in":["PAKGOV","USAGOV"]}}'
  #json3='{\"date8\":{\"$gte\":[\"19700101\"],\"$lte\":[\"20161231\"]},\"country_code\":{\"$in\":[\"Ahal\",\"West%20Bank\"]}}'
  #print(4)
  #url2='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={\"date8\":{\"$gte\":\"20160101\",\"$lte\":\"20161231\"},\"source\":{\"$in\":[\"USAGOV\"]},\"target\":{\"$in\":[\"PAK\"]}}'
  #url3="http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={\"date8\":{\"$gte\":\"20130101\",\"$lte\":\"20161231\"},\"source\":{\"$in\":[\"USAGOV\"]},\"target\":{\"$in\":[\"PAK\"]},\"root_code\":{\"in\":[\"10\"]}}"
  #testurl='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={%22date8%22:%2220070101%22,%22country_code%22:%22Beijing%20Shi%22,%22source%22:%22SAUGOV%22,%22target%22:%22ISRGOV%22}'
   
   #the final url
   url=paste0("http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query=",json3)
  
  print(url)
      
  #the main REST call. The REST URL returns data in a json format :- {status:success/failure, data:{subsetted lists of the query sent}}
  mydata=jsonlite::fromJSON(url)
  #count the number of rows returned
  rws=nrow(mydata$data)
  
  #extract the data
  dat=as.data.frame(mydata$data)
  df <- subset(dat, select = -c(7,26) )
  
  #write a csv file with the subset data so that the user cna download it, and this can be loaded into the aggragation script.
  write.csv(df,file="../data/subsetdata1.csv")

  #write the number of rows into result for feedback to the user
   jsontest=rjson::toJSON(list(nrws=rws))

  result=list(jsontest)
  }
  #write the result into the response and send
  response$write(result)
  response$finish()
}