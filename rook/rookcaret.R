##
##  rookcaret.r
##
##  7/17/17
##


caret.app <- function(env){
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

    #if the input is invalid
    if(!valid) {
        warning <- TRUE
        result <- list(warning="The request is not valid json. Check for special characters.")
    }
    
    if(!warning) {
        everything <- jsonlite::fromJSON(request$POST()$solaJSON)
        print(everything)
    }
    
    #for dependent variable
    if(!warning){
		mydv <- everything$zdv
        if(length(mydv) == 0){
			warning <- TRUE
			result<-list(warning="No dependent variable selected.")
		}
        if(length(mydv) > 1){
			warning <- TRUE
			result<-list(warning="Too many dependent variable selected.")
		}
	}

	#for model selection
	if(!warning){
		mymodel <- everything$zmodel
		if(identical(mymodel,"")){
			warning <- TRUE
			result<-list(warning="No model selected.")
		}
	}
    
	if(!warning){
		mymodelcount <- everything$zmodelcount
		if(identical(mymodelcount,"")){
			warning <- TRUE
			result<-list(warning="No model count.")
		}
	}

	#other things happened
	if(!warning){
        myplot <- everything$zplot
        if(is.null(myplot)){
            warning <- TRUE
            result <- list(warning="Problem with zplot.")
        }
    }
    
    if(!warning){
		mysetx <- everything$zsetx
        myvars <- everything$zvars
        setxCall <- buildSetx(mysetx, myvars)
	}


	if(!warning){
        myedges<-everything$zedges
        print(myedges)
      
	}
	
     if(!warning){
        mysessionid <- everything$zsessionid
        mylogfile<-logFile(mysessionid, production)
        if(mysessionid==""){
            warning <- TRUE
            result <- list(warning="No session id.")
        }
    }

}
