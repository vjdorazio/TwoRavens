##
##  rookcaret.r
##
##  7/17/17
##


caret.app <- function(env){
	calculate_result <- FALSE
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
            #mydata <- readData(sessionid=mysessionid,logfile=mylogfile)
            write(deparse(bquote(mydata<-read.delim(file=.(paste("data_",mysessionid,".tab",sep=""))))),mylogfile,append=TRUE)
        }else{
            #mydata <- read.delim("../data/fearonLaitin.tsv")
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
        #print(myformula)
        print(setxCall)

        tryCatch({
          # get dependent variable
          class <- everything$zdv
          all <- everything$zvars
          feature <- setdiff(zvar,zdv)
          #data(iris)
          write("mydata <- everything$zdv",mylogfile,append=TRUE)

          # ## 2. additional subset of the data in the event that a user wants to estimate a model on the subset, but hasn't "selected" on the subset. that is, just brushed the region, does not press "Select", and presses "Estimate"

            #for caret, we should split the data and train it
            #split=0.80
			#trainIndex <- createDataPartition(iris$Species, p=split, list=FALSE)
			#data_train <- iris[ trainIndex,]
			#data_test <- iris[-trainIndex,]
            #model <- train(Species ~ ., data=data_train, method="rf", prox=TRUE)
            #TrainFeature <- iris[,1:4]
			#TrainClasses <- iris[,5]
            result <- train(feature, class,
                  method = "knn",
                  preProcess = c("center", "scale"),
                  tuneLength = 10,
                  trControl = trainControl(method = "cv"))
 
            write("result <- train(TrainData, TrainClasses, method=mymodel)",mylogfile,append=TRUE)
			resultMatrix <- confusionMatrix(result)
			accuracy_value <- sum(diag(resultMatrix$table))/100
			result<-list(Accuracy=accuracy_value)
			result<-jsonlite:::toJSON(result)
            calculate_result <- TRUE
        })
    }
    
    if(!calculate_result){
    	result<-jsonlite:::toJSON(result)
    }
	
    print(result)
    
    response$write(result)
    response$finish()
}
