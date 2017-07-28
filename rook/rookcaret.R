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

    if(!warning){
        if(production){
            mydata <- readData(sessionid=mysessionid,logfile=mylogfile)
            write(deparse(bquote(mydata<-read.delim(file=.(paste("data_",mysessionid,".tab",sep=""))))),mylogfile,append=TRUE)
        }else{
            mydata <- read.delim("../data/fearonLaitin.tsv")
            write("mydata <- read.delim(\"../data/fearonLaitin.tsv\")",mylogfile,append=TRUE)
            #mydata <- read.delim("../data/QualOfGovt.tsv")
        }
    }

    # if(!warning){
    #     mysubset <- parseSubset(everything$zsubset)
    #     if(is.null(mysubset)){
    #         warning <- TRUE
    #         result <- list(warning="Problem with subset.")
    #     }
    # }

    if(!warning){
        history <- everything$callHistory
        
        t<-jsonlite::toJSON(history)
        write(deparse(bquote(history<-jsonlite::fromJSON(.(t)))),mylogfile,append=TRUE)
        
        if(is.null(history)){
            warning<-TRUE
            result<-list(warning="callHistory is null.")
        }
    }

    # if(!warning){
    #     mynoms <- everything$znom
    #     myformula <- buildFormula(dv=mydv, linkagelist=myedges, varnames=NULL, nomvars=mynoms) 
    #     if(is.null(myformula)){
    #         warning <- TRUE
    #         result<-list(warning="Problem constructing formula expression.")
    #     }
    # }

    if(warning){
        print(warning)
        print(result)
    }


    if(!warning){
        //print(myformula)
        print(setxCall)

        tryCatch({
          ## 1. prepare mydata so that it is identical to the representation of the data in TwoRavens
          mydata <- executeHistory(data=mydata, history=history)
          write("mydata <- executeHistory(data=mydata, history=history)",mylogfile,append=TRUE)

          # ## 2. additional subset of the data in the event that a user wants to estimate a model on the subset, but hasn't "selected" on the subset. that is, just brushed the region, does not press "Select", and presses "Estimate"
          # usedata <- subsetData(data=mydata, sub=mysubset, varnames=myvars, plot=myplot)
          # usedata <- refactor(usedata) # when data is subset, factors levels do not update, and this causes an error in zelig's setx(). refactor() is a quick fix
          # write("usedata <- subsetData(data=mydata, sub=mysubset, varnames=myvars, plot=myplot)",mylogfile,append=TRUE)
          # write("usedata <- refactor(usedata))",mylogfile,append=TRUE)

            #for caret, we should split the data and train it
            c.model <- train(Species~., data=usedata, method=mymodel)   # maybe just pass variables being used?
            write("c.model <- train(Species~., data=usedata, method=mymodel)",mylogfile,append=TRUE)

            print(summary(c.model))
        })
    }

}
