##
##  rookexplore.R
##
##  First version: May 25, 2017
##


explore.app <- function(env){
    
    production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
    warning<-FALSE  
    result <-list()

    if(production){
        sink(file = stderr(), type = "output")
    }
    
    request <- Request$new(env)
    response <- Response$new(headers = list( "Access-Control-Allow-Origin"="*"))
    
    valid <- jsonlite::validate(request$POST()$solaJSON)
    print(valid)
    if(!valid) {
        warning <- TRUE
        result <- list(warning="The request is not valid json. Check for special characters.")
    }
    
    if(!warning) {
        everything <- jsonlite::fromJSON(request$POST()$solaJSON)
        print(everything)
    }

#	if(!warning){
#		mymodel <- everything$zmodel
#		if(identical(mymodel,"")){
#			warning <- TRUE
#			result<-list(warning="No model selected.")
#		}
#	}
    
	if(!warning){
		mymodelcount <- everything$zmodelcount
		if(identical(mymodelcount,"")){
			warning <- TRUE
			result<-list(warning="No model count.")
		}
	}
    
    if(!warning){
        myplot <- everything$zplot
        if(is.null(myplot)){
            warning <- TRUE
            result <- list(warning="Problem with zplot.")
        }
    }

	if(!warning){
        myedges<-everything$zedges
        print(myedges)
        
        myvars <- unique(myedges)
        print(myvars)
        ## Format seems to have changed:
        #		myedges<-edgeReformat(everything$zedges)
		#if(is.null(myedges)){
		#	warning <- TRUE
		#	result<-list(warning="Problem creating edges.")
		#}
	}
    
    if(!warning){
        mysessionid <- everything$zsessionid
        mylogfile<-logFile(mysessionid, production)
        if(mysessionid==""){
            warning <- TRUE
            result <- list(warning="No session id.")
        }
    }

	if(!warning){
        if(production){
            mydata <- readData(sessionid=mysessionid,logfile=mylogfile)
            write(deparse(bquote(mydata<-read.delim(file=.(paste("data_",mysessionid,".tab",sep=""))))),mylogfile,append=TRUE)
        }else{
            # This is the Strezhnev Voeten data:
            #   		mydata <- read.delim("../data/session_affinity_scores_un_67_02132013-cow.tab")
            # This is the Fearon Laitin data:
            mydata <- read.delim("../data/fearonLaitin.tsv")
            write("mydata <- read.delim(\"../data/fearonLaitin.tsv\")",mylogfile,append=TRUE)
            #mydata <- read.delim("../data/QualOfGovt.tsv")
        }
	}
    
    if(!warning){
        history <- everything$callHistory
        
        t<-jsonlite::toJSON(history)
        write(deparse(bquote(history<-jsonlite::fromJSON(.(t)))),mylogfile,append=TRUE)
        
        if(is.null(history)){
            warning<-TRUE
            result<-list(warning="callHistory is null.")
        }
    }

    if(warning){
        print(warning)
        print(result)
    }

	if(!warning){
      
        tryCatch({
          
          ## 1. prepare mydata so that it is identical to the representation of the data in TwoRavens
          mydata <- executeHistory(data=mydata, history=history)
          write("mydata <- executeHistory(data=mydata, history=history)",mylogfile,append=TRUE)
          imageVector<<-list()
          
          for(i in 1:nrow(myedges)) {
              plotcount<-i
              usepair <- unique(myedges[i,])
              usedata <- mydata[,c(usepair)]
              
              missmap<-!is.na(usedata)
              isobserved<-apply(missmap,1,all)
              usedata<<-usedata[isobserved,]
              
              spTEST <- "plot(usedata[,1],usedata[,2])"
              almostCall<-"plot call"
              
              if(production){
                  plotpath <- "png(file.path(\"/var/www/html/custom/pic_dir\", paste(mysessionid,\"_\",mymodelcount,qicount,\".png\",sep=\"\")))"
              }else{
                  plotpath <- "png(file.path(getwd(), paste(\"output\",mymodelcount,i,\".png\",sep=\"\")))"
              }
              
              eval(parse(text=plotpath))
              eval(parse(text=spTEST))
              dev.off()
              
              # zplots() recreates Zelig plots
              #images <- zplots(s.out, plotpath, mymodelcount, mysessionid, production=production)
              #write("plot(s.out)",mylogfile,append=TRUE)
              
              if(production){
                  imageVector[[plotcount]]<<-paste("https://beta.dataverse.org/custom/pic_dir/", mysessionid,"_",mymodelcount,plotcount,".png", sep = "")
              }else{
                  imageVector[[plotcount]]<<-paste("rook/output",mymodelcount,plotcount,".png", sep = "")
              }
              
              
              images<-imageVector ## zplots() returns imageVector, just for consistency
              
              if(length(images)>0){
                  names(images)<-paste("output",1:length(images),sep="")
                  result<-list(images=images, call=almostCall)
              }else{
                  warning<-TRUE
                  result<-list(warning="There are no graphs to show.")
              }
        }
        },
        
        error=function(err){
            warning <<- TRUE ## assign up the scope bc inside function
            result <<- list(warning=paste("Plot error: ", err))
        })
	}


    ## NOTE: z.out not guaranteed to exist, if some warning is tripped above.
    #  if(!warning){

#        summaryMatrix <- summary(z.out$zelig.out$z.out[[1]])$coefficients
        
        #        sumColName <- c(" ", "Estimate", "SE", "t-value", "Pr(<|t|)")
        #sumInfo <- list(colnames=sumColName)
    
    #     sumRowName <- row.names(summaryMatrix)
    #    row.names(summaryMatrix) <- NULL # this makes remaining parsing cleaner
    #    colnames(summaryMatrix) <- NULL
    
    #     for (i in 1:nrow(summaryMatrix)) {
    #        assign(paste("row", i, sep = ""), c(sumRowName[i],summaryMatrix[i,]))
    #       assign("sumInfo", c(sumInfo, list(eval(parse(text=paste("row",i,sep=""))))))
    #    }
    #    sumMat <- list(sumInfo=sumInfo)
    
    #     result<- jsonlite:::toJSON(c(result,sumMat))   # rjson does not format json correctly for a list of lists
    #}else{
        result<-jsonlite:::toJSON(result)
        #}
    
    print(result)
    if(production){
        sink()
    }
    response$write(result)
    response$finish()
    
}


