##
##  build.R
##
##  8/4/15
##
library(jsonlite)
library(RJSONIO)
#sourc=NULL
build.app<-function(env){
  
  production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  warning<-FALSE
  if(production){
    sink(file = stderr(), type = "output")
  }
  request <- Request$new(env)
  response <- Response$new(headers = list( "Access-Control-Allow-Origin"="*"))
  result <- list()
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
  temp1=substr(everything,2,(nchar(everything)-1))
  everything=rjson::fromJSON(temp1)
  #print(everything$var)
  
  level=everything$level
  code2final=NULL
  code3final=NULL
  
  switch (level,
    one = {
      code=everything$code
      var=everything$var
      
      #jsonout=' {"var":"sourc","level":"one","code":["JPN","SAU","USA"]}'
      #dt=fromJSON(jsonout)
      #code1=c("MNC", "NGO")
      #code=dt$code
      lst=list()
      #code2=NULL
      #colnames(code2)<-c("code1","code2")
      
      for(i in 1:length(code)){
        code1=code[i]
        if(var=="Source")
        {query=capture.output(cat('http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={"src_actor":"',code[i],'"}&unique=src_agent',sep=""))}
        else
        {query=capture.output(cat('http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={"tgt_actor":"',code[i],'"}&unique=tgt_agent',sep=""))}
        #query='http://10.176.148.60:5002/api/data?api_key=CD75737EF4CAC292EE17B85AAE4B6&query={"src_actor":"RUS"}&unique=src_agent'
        
        d=fromJSON(query)
        
        #code2<-cbind(code2,d$data)
        code2<-d$data
        lst[[code1]]<-code2
        
      }
    
      
    #  colnames(code2)<-code
      
     # code2<-as.data.frame(code2)
      
      #codetest=as.data.frame(t(code2))
      #codetest=unname(code2)
      #print(code1)
      #for(i in 1:length(code1)){
       # #code2=as.data.frame(eval(parse(text=everything$var))[which(eval(parse(text=everything$var))$code1==code1),])
        #code2=eval(parse(text=everything$var))[which(eval(parse(text=everything$var))$code1==code1[i]),]
        #code2=code2[,c("code1","code2")]
        
        #code2=unique(code2)
        #code2final=as.data.frame(rbind(code2final,code2))
        #lst=append(lst,list(code1=code1[i],code2=code2))
        #lst=append(lst,list(code1[1]=code2))
      #}
      
      #rownames(code2final)<-("NGO")
        #code2final$code1
      
      
      #code2=as.data.frame(eval(parse(text=everything$var))[which(eval(parse(text=everything$var))$code1==code1),])
      #code2=as.data.frame(unique(code2$code2))
      #colnames(code2)<-("code")
      #jsondata=jsonlite::toJSON(codetest)
      
      jsondata=jsonlite::toJSON(lst)
     # print(jsondata)
      result=list(jsondata)
    }
    
  )
  
  
  
  
  response$write(result)
  #print(response)
  response$finish()
  
  
}