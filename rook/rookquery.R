##
##  querydata.R
##
##  8/4/15
##
library(jsonlite)
#library(RJSONIO)
#sourc=NULL
query.app<-function(env){
  
  
  production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  warning<-FALSE
  
  if(production){
    sink(file = stderr(), type = "output")
  }
  request <- Request$new(env)
  response <- Response$new(headers = list( "Access-Control-Allow-Origin"="*"))
  result <- list()
  print(request$POST()$solaJSON)
  valid <- jsonlite::validate(request$POST()$solaJSON)
  #print(valid)
  #print(1)
  if(!valid) {
    warning <- TRUE
    result <- list(warning="The request is not valid json. Check for special characters.")
  }
  #print(2)
  
# 
  #url="http://10.176.148.60:5000/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&select=source&query={}"
  #url2="http://10.176.148.60:5000/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&select=date,location,country&query={}"
  
  
  #url="http://10.176.148.60:5000/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query=<query-for-data>&select=<comma-separated-list-of-attributes>"
# &select=date,country
  #json='[{\"location\":{\"$in\":[\"Budapest\",\"Abuja\"]}}]'
  #json2=substr(json,2,(nchar(json)-1))
  
  #json3=gsub("\\+","",json2)
  #valid<-jsonlite::validate(json);
#  everything <- rjson::fromJSON(json)
  
  #print(3)  
  if(!warning) {
    everything <- request$POST()$solaJSON
    print("value of Everything")
    print(everything)
  }
  
  #################################################################
  #################################################################
  ##################################################################
  #temp1=substr(everything,2,(nchar(everything)-1))
  temp2=rjson::fromJSON(everything)
  print("temp")
  print(temp2)
  type=temp2$type
  if(type=="prequery"){
  
    #testurl='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=country_code'
    preurl=c("http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=src_actor",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=tgt_actor",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=date8",
             "http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={}&unique=country_code")
    
    #preurl2='http://10.176.148.60:5000/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={"code":"057","code":"010"}'

    
    #srcagnturl='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={"src_actor":{"$in":["USA","DEU"]}}&select=src_actor,src_agent'
    #preurl="http://10.176.148.60:5000/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&select=source,target,date,location&query={}"
    #predata=jsonlite::fromJSON(preurl)
    #datatest=jsonlite::fromJSON(srcagnturl)
    #test=predata$data
    #testsrc=datatest$data
  

  
  
  
 
  print("test2")
  
  sourc<<-sort((jsonlite::fromJSON(preurl[1]))$data,decreasing = FALSE)
  target<<-sort((jsonlite::fromJSON(preurl[2]))$data,decreasing=FALSE)
  #date=(jsonlite::fromJSON(preurl[1]))$data
  #location=predata$data$location
  #country=mydata$data$country
  
  location=sort((jsonlite::fromJSON(preurl[4]))$data,decreasing=FALSE)
  date=jsonlite::fromJSON(preurl[3])$data
  datetest=as.Date(date,"%Y%m%d")
  datesort=sort(datetest)
  #maxdate=datesort[which.max(datesort)]
  maxdate=datesort[which.max(datesort)]
  #mindate=datesort[which.min(datesort)]
  mindate=datesort[which.min(datesort)]
  
  jsondata=jsonlite::toJSON(list(maxdate=maxdate,mindate=mindate,location=location,sourceactors=sourc,targetactors=target))
  #print(jsondata)
  result=list(jsondata)
  }
  #write(jsondata,file="pretarget.json")
  #################################################################
  #################################################################
  ##################################################################
  else{
  tmp1=substr(everything,2,(nchar(everything)-1))
#  tmp2=rjson::fromJSON(everything)
  query=temp2$query
  print("value of query")
  print(query)
      json2=jsonlite::toJSON(query)
    print("value of json2")
    print(json2)
   #json2='{"$or":[{"date":{"$gte":"$date(2016-05-24)","$lte":"$date(2016-05-25)"}},{"location":{"$in":["United States of America"]}}]}'
   json3=gsub(" ","%20",json2)
   xx <- unlist(strsplit(json3,""))
   xx[c(18,29,38,49)] <- c("", "", "","")
   json3=paste0(xx,collapse='')
   
   #json3='{"date8":{"$gte":"[19700101]","$lte":"[20161231]"},"country_code":{"$in":["Ahal","West%20Bank"]}}'
    #     '{"date8":{"$gte":"20070101","$lte":"20101231"},"country_code":{"$in":["Beijing%Shi","Illinois"]},"source":{"$in":["SAUGOV","INDGOV"]},"target":{"$in":["PAKGOV","USAGOV"]}}'
   #json3='{\"date8\":{\"$gte\":[\"19700101\"],\"$lte\":[\"20161231\"]},\"country_code\":{\"$in\":[\"Ahal\",\"West%20Bank\"]}}'
   print(4)
  url=paste0("http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query=",json3)
  #url2='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={\"date8\":{\"$gte\":\"20160101\",\"$lte\":\"20161231\"},\"source\":{\"$in\":[\"USAGOV\"]},\"target\":{\"$in\":[\"PAK\"]}}'
  #url3="http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={\"date8\":{\"$gte\":\"20130101\",\"$lte\":\"20161231\"},\"source\":{\"$in\":[\"USAGOV\"]},\"target\":{\"$in\":[\"PAK\"]},\"root_code\":{\"in\":[\"10\"]}}"

  #testurl='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={%22date8%22:%2220070101%22,%22country_code%22:%22Beijing%20Shi%22,%22source%22:%22SAUGOV%22,%22target%22:%22ISRGOV%22}'
  print(url)
  
  #jsontest='{"9":{"33":{"74":[{"label":"V155","labs":"Bird Flu and Epidemics"},{"label":"V415","labs":"Fowl and Meat Industry"}]}}}'
      
#  dt=jsonlite::fromJSON(jsontest)
  mydata=jsonlite::fromJSON(url)
    #mydata=getURL(url)
  #print(mydata)
 # t=mydata$data
  rws=nrow(mydata$data)
  dat=as.data.frame(mydata$data)
  df <- subset(dat, select = -c(7,26) )
  write.csv(df,file="../data/subsetdata1.csv")
  #test=mydata$data
  #date=mydata$data$date
  #location=mydata$data$location
  #country=mydata$data$country
  
  #location2=unique(location)
  #datesort=sort(date)
  #maxdate=datesort[which.max(datesort)]
  #mindate=datesort[which.min(datesort)]
  
  #outdata=list(maxdate=maxdate,mindate=mindate,location=location2)
  jsontest=rjson::toJSON(list(nrws=rws))
  
  result=list(jsontest)
  }
  response$write(result)
  #print(response)
  response$finish()
}