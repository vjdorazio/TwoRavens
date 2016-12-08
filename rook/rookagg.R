## Source (sou) & Target (tar) are from Original dataset, column Source (the most detailed column) ##
## ss dataset: subset ##

query.app<-function(env){
  production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development
  warning<-FALSE
  
  if(production){
    sink(file = stderr(), type = "output")
  }
  request <- Request$new(env)
  response <- Response$new(headers = list( "Access-Control-Allow-Origin"="*"))
  result <- list()
  
  
  valid <- jsonlite::validate(request$POST()$solaJSON)
  #print(valid)
  #print(1)
  if(!valid) {
    warning <- TRUE
    result <- list(warning="The request is not valid json. Check for special characters.")
  }
  
  
  if(!warning) {
    everything <- request$POST()$solaJSON
    print("value of Everything")
    print(everything)
  }
  
  
  

  sou <- c("USAGOV","RUS")
  tar <- c("KENGOV", "IRQ", "SYR")
  
  ss <- events[grepl(paste(sou, collapse= "|"), events$Source) &
                 grepl(paste(tar, collapse= "|"),events$Target),]
  
  
  
  
  
}





# Function "makets" : to 
makets <- function(x)
{
  # Get the daily crosstab
  x1 <- table(x$Date, x$QuadClass) # get frequency of each Quadclass for each date. All Quadclass in 1 column
  
  # Now make the time series
  x2 <- xts(x1[,1:5], as.Date(rownames(x1),
                              format="%Y%m%d")) # Divide different Quadclass in different columns
  colnames(x2) <- c("Neutral", "VCoop", "MCoop", "VConf", "MConf")
  return(x2)
}

#ss1 <- events[grepl(paste("RUS", collapse= "|"), events$Source) &
    #           grepl(paste("SYR", collapse= "|"),events$Target),]
#x11 <- table(ss1$Date, ss1$QuadClass)
#View(x11)
#x21 <- xts(x11[,1:5], as.Date(rownames(x11),
                      #      format="%Y%m%d"))
#colnames(x21) <- c("Neutral", "VCoop", "MCoop", "VConf", "MConf")
# View(x21)

## Aggdata: Aggregated dataset by QuadClass for each Source - Target combination 

aggdaily<-function(sou,tar){
  aggdata <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
  aggdata <- aggdata[0,]
  
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temp <- ss[which(ss$Source==sou[i] & ss$Target==tar[j]),] 
      if(nrow(temp)==0) next
      temp1 <- as.data.frame(makets(temp))
      temp1$Source<-as.character(sou[i])
      temp1$Target<-as.character(tar[j])
      if(i==1 & j==1) {
        aggdata<-temp1
      }
      else {
        aggdata <- rbind(aggdata, temp1)
      }
    }
  }
  
  #########
  # Order by Date
  aggdata.ts <- data.frame (Date=as.Date(rownames(aggdata)), coredata(aggdata)) 
  aggdata.ts.sorted.day <- aggdata.ts[order(aggdata.ts$Date),] # sorted event by Date order
  
  # Pad 0 to all missing dates for all Source-Target combination -> dataset: aggdata2 
  aggdata2 <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
  aggdata2 <- aggdata2[0,]
  
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temp2 <- aggdata.ts.sorted.day[which(aggdata.ts.sorted.day$Source==sou[i] 
                                           & aggdata.ts.sorted.day$Target==tar[j]),] 
      if(nrow(temp2)==0) next
      temp2.length <- length (temp2$Date)
      temp2.time.min <- temp2$Date[1]
      temp2.time.max <- temp2$Date[temp2.length]
      all.dates <- seq(temp2.time.min,temp2.time.max, by = "day")
      all.dates.frame <- data.frame(list(Date=all.dates))
      temp2.merged <- merge(all.dates.frame,temp2, all=T)
      temp2.merged[,2:6][(is.na(temp2.merged[,2:6]))] <- 0
      temp2.merged$Source<-as.character(sou[i])
      temp2.merged$Target<-as.character(tar[j])
      if(i==1 & j==1) {
        aggdata2<-temp2.merged
      }
      else {
        aggdata2 <- rbind(aggdata2, temp2.merged)
      }
    }
  }
  #View(aggdata2)
    
  return(aggdata2)
}



aggweekly<-function(sou,tar){

  # MAKE WEEKLY -> dataset: aggdata.weekly.ts
  
  aggdata.weekly <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
  aggdata.weekly <- aggdata2[0,]
  
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temp3 <- aggdata2[which(aggdata2$Source==sou[i] 
                              & aggdata2$Target==tar[j]),] 
      if(nrow(temp3)==0) next
      temp4 <- xts (temp3[2:6], as.Date(temp3$Date, format='%m/%d/%Y'))
      for(k in 1:ncol(temp4)){
        temp41 <- data.frame(apply.weekly(temp4[,1], sum))
        temp42 <- data.frame(apply.weekly(temp4[,2], sum))
        temp43 <- data.frame(apply.weekly(temp4[,3], sum))
        temp44 <- data.frame(apply.weekly(temp4[,4], sum))
        temp45 <- data.frame(apply.weekly(temp4[,5], sum))
      }
      temp4.weekly <- cbind(temp41, temp42, temp43, temp44, temp45)
      temp5 <- as.data.frame(temp4.weekly)
      temp5$Source<-as.character(sou[i])
      temp5$Target<-as.character(tar[j])
      if(i==1 & j==1) {
        aggdata.weekly<-temp5
      }
      else {
        aggdata.weekly <- rbind(aggdata.weekly, temp5)
      }
    }
  }
  
  #View(temp4.weekly)
  #View(temp5)
  View(aggdata.weekly) # cons: have rownames (date) overlapped -> move rowname to the 1st column
  aggdata.weekly.ts <- data.frame (Date=as.Date(rownames(aggdata.weekly)), coredata(aggdata.weekly)) 
  View(aggdata.weekly.ts) 
  View(aggdata.weekly)
  
}


aggmonthly<-function(sou,tar){
# MAKE MONTHLY -> dataset: aggdata.monthly.ts

aggdata.monthly <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
aggdata.monthly <- aggdata2[0,]

for(i in 1:length(sou)) {
  for(j in 1:length(tar)) {
    temp3 <- aggdata2[which(aggdata2$Source==sou[i] 
                            & aggdata2$Target==tar[j]),] 
    if(nrow(temp3)==0) next
    temp4 <- xts (temp3[2:6], as.Date(temp3$Date, format='%m/%d/%Y'))
    for(k in 1:ncol(temp4)){
      temp41 <- data.frame(apply.monthly(temp4[,1], sum))
      temp42 <- data.frame(apply.monthly(temp4[,2], sum))
      temp43 <- data.frame(apply.monthly(temp4[,3], sum))
      temp44 <- data.frame(apply.monthly(temp4[,4], sum))
      temp45 <- data.frame(apply.monthly(temp4[,5], sum))
    }
    temp4.monthly <- cbind(temp41, temp42, temp43, temp44, temp45)
    temp5 <- as.data.frame(temp4.monthly)
    temp5$Source<-as.character(sou[i])
    temp5$Target<-as.character(tar[j])
    if(i==1 & j==1) {
      aggdata.monthly<-temp5
    }
    else {
      aggdata.monthly <- rbind(aggdata.monthly, temp5)
    }
  }
}

aggdata.monthly.ts <- data.frame (Date=as.Date(rownames(aggdata.monthly)), coredata(aggdata.monthly))
write.csv(aggdata.monthly.ts, file = "/Users/phama/Desktop/monthagg.csv")

View(aggdata.monthly.ts)
}#end of aggmonthly




aggquarterly<-function(sou,tar){
# Make QUARTERLY -> dataset: aggdata.quarterly.ts

aggdata.quarterly <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
aggdata.quarterly <- aggdata2[0,]

for(i in 1:length(sou)) {
  for(j in 1:length(tar)) {
    temp3 <- aggdata2[which(aggdata2$Source==sou[i] 
                            & aggdata2$Target==tar[j]),] 
    if(nrow(temp3)==0) next
    temp4 <- xts (temp3[2:6], as.Date(temp3$Date, format='%m/%d/%Y'))
    for(k in 1:ncol(temp4)){
      temp41 <- data.frame(apply.quarterly(temp4[,1], sum))
      temp42 <- data.frame(apply.quarterly(temp4[,2], sum))
      temp43 <- data.frame(apply.quarterly(temp4[,3], sum))
      temp44 <- data.frame(apply.quarterly(temp4[,4], sum))
      temp45 <- data.frame(apply.quarterly(temp4[,5], sum))
    }
    temp4.quarterly <- cbind(temp41, temp42, temp43, temp44, temp45)
    temp5 <- as.data.frame(temp4.quarterly)
    temp5$Source<-as.character(sou[i])
    temp5$Target<-as.character(tar[j])
    if(i==1 & j==1) {
      aggdata.quarterly<-temp5
    }
    else {
      aggdata.quarterly <- rbind(aggdata.quarterly, temp5)
    }
  }
}

aggdata.quarterly.ts <- data.frame (Date=as.Date(rownames(aggdata.quarterly)), coredata(aggdata.quarterly))
View(aggdata.quarterly.ts)
}#end of aggquarterly



aggyearly<-function(sou,tar){
# Make YEARLY -> dataset: aggdata.yearly.ts

aggdata.yearly <- data.frame(Date="", Neutral=0, VCoop=0, MCoop=0, VConf=0, MConf=0, Source="", Target="")
aggdata.yearly <- aggdata2[0,]

for(i in 1:length(sou)) {
  for(j in 1:length(tar)) {
    temp3 <- aggdata2[which(aggdata2$Source==sou[i] 
                            & aggdata2$Target==tar[j]),] 
    if(nrow(temp3)==0) next
    temp4 <- xts (temp3[2:6], as.Date(temp3$Date, format='%m/%d/%Y'))
    for(k in 1:ncol(temp4)){
      temp41 <- data.frame(apply.yearly(temp4[,1], sum))
      temp42 <- data.frame(apply.yearly(temp4[,2], sum))
      temp43 <- data.frame(apply.yearly(temp4[,3], sum))
      temp44 <- data.frame(apply.yearly(temp4[,4], sum))
      temp45 <- data.frame(apply.yearly(temp4[,5], sum))
    }
    temp4.yearly <- cbind(temp41, temp42, temp43, temp44, temp45)
    temp5 <- as.data.frame(temp4.yearly)
    temp5$Source<-as.character(sou[i])
    temp5$Target<-as.character(tar[j])
    if(i==1 & j==1) {
      aggdata.yearly<-temp5
    }
    else {
      aggdata.yearly <- rbind(aggdata.yearly, temp5)
    }
  }
}

aggdata.yearly.ts <- data.frame (Date=as.Date(rownames(aggdata.yearly)), coredata(aggdata.yearly))
View(aggdata.yearly.ts)
}#end of aggyearly



plotevent<-function(){
## PLOT  ## 

#plotEvent <- function(aggdata.weekly, main)
#{
#  for(i in 1:length(sou)) {
#    for(j in 1:length(tar)) {
#      temp33 <- aggdata.weekly[which(aggdata.weekly$Source==sou[i] 
#                                     & aggdata.weekly$Target==tar[j]),] 
#      if(nrow(temp33)==0) next
#      temp33.ts <- data.frame (Date=as.Date(rownames(temp33)), coredata(temp33))
#     l <- reshape(temp33.ts, 
#                   varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
#                   v.names = "Counts",
#                   timevar = "Types", 
#                   times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
#                   new.row.names = 1:1000,
#                   direction = "long")
#      ggplot(l, aes(x=Date, y=Counts, color= Types)) +
#        geom_line(size=1, alpha=0.8)+theme_bw() +
#        scale_x_date(date_breaks="months", labels=date_format("%b %d")) +
#        theme(strip.background = element_rect(fill = 'white')) +
#        ggtitle("Russia to Iraq events per week")
#    }
#  }
#}

for(i in 1:length(sou)) {
   for(j in 1:length(tar)) {

     
     plotEvent(aggdataweekly=aggdata.weekly,main="test",source=sou[i],target=tar[j])
   }
}
plotEvent <- function(aggdataweekly, main, source, target)
{
  #for(i in 1:length(sou)) {
  # for(j in 1:length(tar)) {
     temp33 <- aggdata.weekly[which(aggdata.weekly$Source==source 
                                     & aggdata.weekly$Target==target),] 
#      if(nrow(temp33)==0) next
#      temp33.ts <- data.frame (Date=as.Date(rownames(temp33)), coredata(temp33))
#     l <- reshape(temp33.ts, 
#                   varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
#                   v.names = "Counts",
#                   timevar = "Types", 
#                   times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
#                   new.row.names = 1:1000,
#                   direction = "long")
#      ggplot(l, aes(x=Date, y=Counts, color= Types)) +
#        geom_line(size=1, alpha=0.8)+theme_bw() +
#        scale_x_date(date_breaks="months", labels=date_format("%b %d")) +
#        theme(strip.background = element_rect(fill = 'white')) +
#        ggtitle("Russia to Iraq events per week")
#    }
#  }
}

## Reshape from Wide to Long format to use ggplot
## Plot WEEKLY aggregation

temp33 <- aggdata.weekly[which(aggdata.weekly$Source==sou[2] 
                               & aggdata.weekly$Target==tar[2]),] 
temp33.ts <- data.frame (Date=as.Date(rownames(temp33)), coredata(temp33))
#View(temp33.ts)
# l: long format of wide format dataset temp33.ts
l <- reshape(temp33.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
#View(l)
ggplot(l, aes(x=Date, y=Counts, color= Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(date_breaks="weeks", labels=date_format("%b %y")) +
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per week")

## Plot MONTHLY aggregation

temp44 <- aggdata.monthly[which(aggdata.monthly$Source==sou[2] 
                                & aggdata.monthly$Target==tar[2]),] 
temp44.ts <- data.frame (Date=as.Date(rownames(temp44)), coredata(temp44))
# View(temp44.ts)
# l: long format of wide format dataset temp44.ts
l <- reshape(temp44.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(l)
ggplot(l, aes(x=Date, y=Counts, color= Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(date_breaks="months", labels=date_format("%b %y")) +
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per month")

## Plot QUARTERLY aggregation

temp55 <- aggdata.quarterly[which(aggdata.quarterly$Source==sou[2] 
                                & aggdata.quarterly$Target==tar[2]),] 
temp55.ts <- data.frame (Date=as.Date(rownames(temp55)), coredata(temp55))
# View(temp55.ts)
# l: long format of wide format dataset temp55.ts
l <- reshape(temp55.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(l)
ggplot(l, aes(x=Date, y=Counts, color= Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(date_breaks="months", labels=date_format("%b %y")) +
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per quarter")

## Plot YEARLY aggregation

temp66 <- aggdata.yearly[which(aggdata.yearly$Source==sou[2] 
                                & aggdata.yearly$Target==tar[2]),] 
temp66.ts <- data.frame (Date=as.Date(rownames(temp66)), coredata(temp66))
# View(temp66.ts)
# l: long format of wide format dataset temp66.ts
l <- reshape(temp66.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(l)
ggplot(l, aes(x=Date, y=Counts, color= Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(date_breaks="months", labels=date_format("%b %y")) +
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per year")
}#end of plot