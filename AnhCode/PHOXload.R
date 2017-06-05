library(ggplot2)
library(dplyr)
library(data.table) # for rbindlist and fread library(stringr)
library(lubridate)
#library(xtable)
library(scales) # for fancy date scales in ggplot library(countrycode)
library(xts)
library(tseries)
library(forecast)


setwd("/Users/phama/Desktop/Dr. D'Orazio/OEDA-PHOX-Data/latest") 
fnames <- list.files(pattern="events.full.*.txt")

eventColClasses <- c("character", rep("integer", 4), rep("character", 8),
                     rep("factor", 3), "numeric", "character",
                     "numeric", "numeric", "character",
                     "character", "character", "character", "character",
                     "character") 
# Read in the files
system.time(eventlist <- lapply(fnames, read.table,
                                stringsAsFactors=FALSE,
                                sep="\t",
                                header=TRUE, colClasses=eventColClasses,
                                quote="", allowEscapes=TRUE, fill=TRUE)) 

### Add column names for 17 elements missing column GID
missing <- c(26, 27, 29,41,42, 45, 46, 77, 205, 231, 232, 383, 394, 395, 506, 648, 649)
events <- eventlist[[1]]
for (k in 2:length(eventlist)){ 
  print(k)
  if (k %in% missing) {
    eventColNames <- c("Date", "Year", "Month", "Day", "Source",
                       "SrcActor", "SrcAgent", "SOthAgent", "Target",
                       "TgtActor", "TgtAgent", "TOthAgent", "CAMEO",
                       "RootCode", "QuadClass", "Goldstein",
                       "None", "Lat", "Lon", "Geoname", "CountryCode",
                       "AdminInfo", "ID", "URL", "sourcetxt")
    setnames(eventlist[[k]], old=names(eventlist[[k]]), new=eventColNames)}
}

### Add column GID and move GID to the 1st column
for (k in 2:length(eventlist)){ 
  if (k %in% missing) {
    eventlist[[k]]$GID <- rownames(eventlist[[k]])
    eventlist[[k]] <- eventlist[[k]] [,c("GID", setdiff(names(eventlist[[k]]), "GID"))]}
}


# Now we can quickly rbind the list into a single dataframe
events <- rbindlist(eventlist)

eventColNames <- c("GID", "Date", "Year", "Month", "Day", "Source",
                   "SrcActor", "SrcAgent", "SOthAgent", "Target",
                   "TgtActor", "TgtAgent", "TOthAgent", "CAMEO",
                   "RootCode", "QuadClass", "Goldstein",
                   "None", "Lat", "Lon", "Geoname", "CountryCode",
                   "AdminInfo", "ID", "URL", "sourcetxt")
setnames(events, old=names(events), new=eventColNames)
View(events)

# Cleanup
rm(eventlist)

## Source (sou) & Target (tar) are from Original dataset, column Source (the most detailed column) ##
## ss dataset: subset ##

sou <- c("USAGOV","RUS")
tar <- c("KENGOV", "IRQ", "SYR")

ss <- events[grepl(paste(sou, collapse= "|"), events$Source) &
               grepl(paste(tar, collapse= "|"),events$Target),]

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


## Aggdata: Aggregated dataset by QuadClass for each Source - Target combination 

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

View(aggdata2)


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


## PLOT  ## 

## Plot QUARTERLY aggregation

temp22 <- aggdata.quarterly[which(aggdata.quarterly$Source==sou[2] 
                                  & aggdata.quarterly$Target==tar[2]),] 
temp22.ts <- data.frame (Date=as.Date(rownames(temp22)), coredata(temp22))
View(temp22.ts)
# q: long format of wide format dataset temp55.ts
q <- reshape(temp22.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")

View(q)

ggplot(q, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=1.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 20, by = 2)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#56B4E9", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) + 
  ggtitle("Russia to Iraq events per quarter") +
  theme(plot.title = element_text(family = "Times New Roman", 
                                  color="#000000", face="bold", size=20, hjust=0.5)) +
  theme(axis.title = element_text(family = "Times New Roman", 
                                  color="#000000", face="bold", size=15)) 


########
#Plot only MCoop
#######
q1 <- reshape(temp22.ts, 
              varying = "MCoop", 
              v.names = "Counts",
              timevar = "Types", 
              times =  "MCoop", 
              new.row.names = 1:1000,
              direction = "long")

View(q1)

ggplot(q1, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=1.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 30, by = 2)) +
  scale_color_manual(values=c("MCoop"="#009E73")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) + 
  ggtitle("Russia to Iraq Material Cooperation events per quarter") +
  theme(plot.title = element_text(family = "Times New Roman", 
                                  color="#000000", face="bold", size=20, hjust=0.5)) +
  theme(axis.title = element_text(family = "Times New Roman", 
                                  color="#000000", face="bold", size=15)) 

###########

## Time Series ##
### Make time series & Test models
####################################################################
# The AR(p) process helps \identify" an MA process. This
# means it tells us how to interpret the ACF and PACF for an MA process.
# The MA(q) process tells us whether an AR process is
# stationary. If it is stationary, shocks to the process will die off.
# ACF cut off/ end abruptly -> MA (q) -> No need to look at PACF
# ACF dampen -> look at PACF -> AR(p)
####################################################################

####################################################################
## Tests to test stationary/ serial correlation ##
#Box JLung Test:  H0: absence of serial correlation
#(Box.test)        # (much stronger than stationary)
# p <<< -> x (reject H0 -> serial correlation)
# p >>> -> v
#Dickey Fuller:   H0: unit root 
#(adf.test)        # (non-stationary, but doesn't always have trend)
# p <<< -> v (reject H0 -> stationary)
# p >>> -> x
#KPSS Test:       H0: trend (stationary)
#(kpss.test)        # p <<< -> x (reject H0 -> non-stationary)
# p >>> -> v
####################################################################

####################################################################

### FINAL
#sou <- c("USAGOV","RUS")
#tar <- c("KENGOV", "IRQ", "SYR")
#In 2Raven interface: non-existent combination need to be grey out
# Get 5 model:for 5 combinations (1,1), (1,2), (1,3), (2,2), (2,3). Comnbination(2,1): non-existent


#Neutral
plotNeutral <- function (x) {
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temptemp <- aggdata2[which(aggdata2$Source==sou[i] 
                                 & aggdata2$Target==tar[j]),] 
      if(nrow(temptemp)==0) next
      temptemp.Neutral <- xts (temptemp[,2], as.Date(temptemp$Date, format='%m/%d/%Y'))
      #adf.test(temptemp.Neutral)
      par(mfrow=c(1,2))
      acf(temptemp.Neutral, lag.max = 50)
      pacf(temptemp.Neutral, lag.max = 50)
      Neutral.fit <- auto.arima(temptemp.Neutral)
      summary(Neutral.fit)
    }
  }
}

plotNeutral(aggdata2)

temptemp11 <- aggdata2[which(aggdata2$Source==sou[1] 
                             & aggdata2$Target==tar[1]),] 
temptemp11.Neutral <- xts (temptemp11[,2], as.Date(temptemp11$Date, format='%m/%d/%Y'))
adf.test(temptemp11.Neutral)
par(mfrow=c(1,2))
acf(temptemp11.Neutral, lag.max = 50)
pacf(temptemp11.Neutral, lag.max = 50)
temptemp11.Neutral.fit <- auto.arima(temptemp11.Neutral)
temptemp11.Neutral.fit <- auto.arima(temptemp11.Neutral,trace=TRUE)
summary(temptemp11.Neutral.fit)
temptemp11.Neutral.mod <- arima (temptemp11.Neutral , order=c(2,0,1))
tsdiag(temptemp11.Neutral.mod)
Box.test(temptemp11.Neutral.mod$residuals)


temptemp12 <- aggdata2[which(aggdata2$Source==sou[1] 
                             & aggdata2$Target==tar[2]),] 
temptemp12.Neutral <- xts (temptemp12[,2], as.Date(temptemp12$Date, format='%m/%d/%Y'))
adf.test(temptemp12.Neutral)
par(mfrow=c(1,2))
acf(temptemp12.Neutral, lag.max = 50)
pacf(temptemp12.Neutral, lag.max = 50)
temptemp12.Neutral.fit <- auto.arima(temptemp12.Neutral)
summary(temptemp12.Neutral.fit)
temptemp12.Neutral.mod <- arima (temptemp12.Neutral , order=c(2,0,2))
tsdiag(temptemp12.Neutral.mod)
Box.test(temptemp12.Neutral.mod$residuals)


temptemp13 <- aggdata2[which(aggdata2$Source==sou[1] 
                             & aggdata2$Target==tar[3]),] 
temptemp13.Neutral <- xts (temptemp13[,2], as.Date(temptemp13$Date, format='%m/%d/%Y'))
adf.test(temptemp13.Neutral)
temptemp13.Neutral.mod <- arima (temptemp13.Neutral , order=c(2,0,0))
tsdiag(temptemp13.Neutral.mod)
Box.test(temptemp13.Neutral.mod$residuals)


temptemp22 <- aggdata2[which(aggdata2$Source==sou[2] 
                             & aggdata2$Target==tar[2]),] 
temptemp22.Neutral <- xts (temptemp22[,2], as.Date(temptemp22$Date, format='%m/%d/%Y'))
adf.test(temptemp22.Neutral)
temptemp22.Neutral.mod <- arima (temptemp22.Neutral , order=c(5,0,2))
tsdiag(temptemp22.Neutral.mod)
Box.test(temptemp22.Neutral.mod$residuals)
acf(temptemp22.Neutral, lag.max = 50)
pacf(temptemp22.Neutral, lag.max=50)


temptemp23 <- aggdata2[which(aggdata2$Source==sou[2] 
                             & aggdata2$Target==tar[3]),] 
temptemp23.Neutral <- xts (temptemp23[,2], as.Date(temptemp23$Date, format='%m/%d/%Y'))
temptemp23.Neutral.1 <- diff(temptemp23.Neutral, differences=1)
adf.test(na.omit(temptemp23.Neutral.1))
par(mfrow=c(1,2))
acf(na.omit(temptemp23.Neutral.1), lag.max = 50)
pacf(na.omit(temptemp23.Neutral.1), lag.max=50)
temptemp23.Neutral.mod <- arima (temptemp23.Neutral.1 , order=c(1,0,1))
tsdiag(temptemp23.Neutral.mod)
Box.test(temptemp23.Neutral.mod$residuals)


# VCoop
plotVCoop <- function (x) {
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temptemp <- aggdata2[which(aggdata2$Source==sou[i] 
                                 & aggdata2$Target==tar[j]),] 
      if(nrow(temptemp)==0) next
      temptemp.VCoop <- xts (temptemp[,3], as.Date(temptemp$Date, format='%m/%d/%Y'))
      #adf.test(temptemp.VCoop)
      par(mfrow=c(1,2))
      acf(temptemp.VCoop, lag.max = 50)
      pacf(temptemp.VCoop, lag.max = 50)
      VCoop.fit <- auto.arima(temptemp.VCoop)
      summary(VCoop.fit)
    }
  }
}

plotVCoop(aggdata2)

# MCoop
plotMCoop <- function (x) {
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temptemp <- aggdata2[which(aggdata2$Source==sou[i] 
                                 & aggdata2$Target==tar[j]),] 
      if(nrow(temptemp)==0) next
      temptemp.MCoop <- xts (temptemp[,4], as.Date(temptemp$Date, format='%m/%d/%Y'))
      #adf.test(temptemp.MCoop)
      par(mfrow=c(1,2))
      acf(temptemp.MCoop, lag.max = 50)
      pacf(temptemp.MCoop, lag.max = 50)
      #MCoop.fit <- auto.arima(temptemp.MCoop)
      #summary(MCoop.fit)
    }
  }
}

plotMCoop(aggdata2)


temptemp22 <- aggdata2[which(aggdata2$Source==sou[2] 
                             & aggdata2$Target==tar[2]),] 

temptemp22.MCoop <- xts (temptemp22[,4], as.Date(temptemp22$Date, format='%m/%d/%Y'))

adf.test(temptemp22.MCoop)
par(mfrow=c(1,2))
acf(temptemp22.MCoop, lag.max = 50)
pacf(temptemp22.MCoop, lag.max = 50)
temptemp22.MCoop.fit<- auto.arima(temptemp22.MCoop)
#temptemp22.MCoop.fit<- auto.arima((temptemp22.MCoop), approximation=FALSE,trace=TRUE)
summary(temptemp22.MCoop.fit)
temptemp22.MCoop.mod <- arima (temptemp22.MCoop , order=c(1,0,0))
tsdiag(temptemp22.MCoop.mod)
Box.test(temptemp22.MCoop.mod$residuals)


temptemp22 <- aggdata2[which(aggdata2$Source==sou[2] 
                             & aggdata2$Target==tar[2]),] 
R2I.MCoop <- xts (temptemp22[,4], as.Date(temptemp22$Date, format='%m/%d/%Y'))
adf.test(R2I.MCoop)
par(mfrow=c(1,2))
acf(R2I.MCoop, lag.max = 50)
pacf(R2I.MCoop, lag.max = 50)
R2I.MCoop.fit<- auto.arima(R2I.MCoop)
#temptemp22.MCoop.fit<- auto.arima((temptemp22.MCoop), approximation=FALSE,trace=TRUE)
summary(R2I.MCoop.fit)
R2I.MCoop.mod <- arima (temptemp22.MCoop , order=c(2,0,0))
summary(R2I.MCoop.mod)
tsdiag(R2I.MCoop.mod)
Box.test(R2I.MCoop.mod$residuals)


aggdata.quarterly.ts

temptemp22 <- aggdata.quarterly[which(aggdata.quarterly$Source==sou[2] 
                            & aggdata.quarterly$Target==tar[2]),] 
View(temptemp22)
temptemp22 <- data.frame (Date=as.Date(rownames(temptemp22)), coredata(temptemp22))
R2I.MCoop <- xts (temptemp22[,4], as.Date(temptemp22$Date, format='%m/%d/%Y'))
adf.test(R2I.MCoop)
par(mfrow=c(1,2))
acf(R2I.MCoop, lag.max = 50)
pacf(R2I.MCoop, lag.max = 50)
R2I.MCoop.fit<- auto.arima(R2I.MCoop)
#temptemp22.MCoop.fit<- auto.arima((temptemp22.MCoop), approximation=FALSE,trace=TRUE)
summary(R2I.MCoop.fit)
R2I.MCoop.mod <- arima (temptemp22$MCoop , order=c(1,0,0))
summary(R2I.MCoop.mod)
tsdiag(R2I.MCoop.mod)
Box.test(R2I.MCoop.mod$residuals)


#VConf

plotVConf <- function (x) {
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temptemp <- aggdata2[which(aggdata2$Source==sou[i] 
                                 & aggdata2$Target==tar[j]),] 
      if(nrow(temptemp)==0) next
      temptemp.VConf <- xts (temptemp[,5], as.Date(temptemp$Date, format='%m/%d/%Y'))
      #adf.test(temptemp.VConf)
      par(mfrow=c(1,2))
      acf(temptemp.VConf, lag.max = 50)
      pacf(temptemp.VConf, lag.max = 50)
      VConf.fit <- auto.arima(temptemp.VConf)
      summary(VConf.fit)
    }
  }
}

plotVConf(aggdata2)

#MConf

plotMConf <- function (x) {
  for(i in 1:length(sou)) {
    for(j in 1:length(tar)) {
      temptemp <- aggdata2[which(aggdata2$Source==sou[i] 
                                 & aggdata2$Target==tar[j]),] 
      if(nrow(temptemp)==0) next
      temptemp.MConf <- xts (temptemp[,6], as.Date(temptemp$Date, format='%m/%d/%Y'))
      #adf.test(temptemp.MConf)
      par(mfrow=c(1,2))
      acf(temptemp.MConf, lag.max = 50)
      pacf(temptemp.MConf, lag.max = 50)
      MConf.fit <- auto.arima(temptemp.MConf)
      summary(MConf.fit)
    }
  }
}

plotMConf(aggdata2)

# "In all cases I have ever seen, event data are stationary" (Dr.Brandt)