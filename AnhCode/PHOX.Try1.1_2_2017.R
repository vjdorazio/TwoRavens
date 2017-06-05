library(ggplot2)
library(dplyr)
library(data.table) # for rbindlist and fread library(stringr)
library(lubridate)
#library(xtable)
library(scales) # for fancy date scales in ggplot library(countrycode)
library(xts)
library(tseries)
library(forecast)
library(tidyr)

## fill in correct working directory
setwd("TwoRavens/AnhCode")

events <- read.csv("../data/samplePhox.csv")

## Source (sou) & Target (tar) are from Original dataset, column Source (the most detailed column) ##
## ss dataset: subset ##

sou <- c("USAGOV","RUS")
tar <- c("KENGOV", "IRQ", "SYR")
QuadClass <- c("0","1","2","3","4")
ss <- events[grepl(paste(sou, collapse= "|"), events$Source) &
grepl(paste(tar, collapse= "|"),events$Target),]
#View(ss)
df <- data.frame(cbind(ss$Date,ss$Source,ss$Target,ss$QuadClass),stringsAsFactors=FALSE)
colnames(df) <- c("Date", "sou", "tar", "QuadClass")
#View(df)

library(tidyr)
aggdata <- df%>%
group_by(Date,sou,tar, QuadClass)%>%
summarise(count=n())%>%
spread(QuadClass,count)
aggdata[is.na(aggdata)] <- 0
colnames(aggdata) <- c("Date", "Source", "Target", "Neutral", "VCoop", "MCoop", "VConf", "MConf")


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
#View(aggdata.weekly) # cons: have rownames (date) overlapped -> move rowname to the 1st column
aggdata.weekly.ts <- data.frame (Date=as.Date(rownames(aggdata.weekly)), coredata(aggdata.weekly)) 
#View(aggdata.weekly.ts) 
#View(aggdata.weekly)

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
#View(aggdata.monthly.ts)

write.csv(aggdata.monthly.ts, file = "/Users/phama/Desktop/monthagg.csv")
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
#View(aggdata.yearly.ts)

## PLOT  ## 



## Reshape from Wide to Long format to use ggplot
##https://www.r-bloggers.com/creating-colorblind-friendly-figures/
##http://www.ucl.ac.uk/~zctpep9/Archived%20webpages/Cookbook%20for%20R%20»%20Colors%20(ggplot2).htm
# for colorblind-friendly 
##http://docs.ggplot2.org/0.9.3.1/scale_date.html
# for breaks
## Plot WEEKLY aggregation

temp33 <- aggdata.weekly[which(aggdata.weekly$Source==sou[2] 
                               & aggdata.weekly$Target==tar[2]),] 
temp33.ts <- data.frame (Date=as.Date(rownames(temp33)), coredata(temp33))
#View(temp33.ts)
# l: long format of wide format dataset temp33.ts

w <- reshape(temp33.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
View(w)
ggplot(w, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(date_breaks="2 months", labels=date_format("%b %y")) +
  scale_color_manual(values=c("#000000", "#E69F00", "#56B4E9", "#009E73", 
                              "#F0E442", "#0072B2", "#D55E00", "#CC79A7")) +
  ylab("Number of events") +
  xlab("Week") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per week")

#plot for week aggregation, palette with black, number of events ylab, week xlab
#library(scales)
ggplot(w, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("6 weeks"),
               labels = date_format("%W %Y")) +
  scale_y_continuous(breaks = seq(0, 15, by = 2)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#009E73", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Week") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per week")


## Plot MONTHLY aggregation

temp44 <- aggdata.monthly[which(aggdata.monthly$Source==sou[2] 
                                & aggdata.monthly$Target==tar[2]),] 
temp44.ts <- data.frame (Date=as.Date(rownames(temp44)), coredata(temp44))
#View(temp44.ts)
# m: long format of wide format dataset temp44.ts
m <- reshape(temp44.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(m)

ggplot(m, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("2 months"),
               labels = date_format("%b %Y")) +
  scale_y_continuous(breaks = seq(0, 20, by = 2)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#009E73", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per month")

## Plot QUARTERLY aggregation

temp55 <- aggdata.quarterly[which(aggdata.quarterly$Source==sou[2] 
                                  & aggdata.quarterly$Target==tar[2]),] 
temp55.ts <- data.frame (Date=as.Date(rownames(temp55)), coredata(temp55))
# View(temp55.ts)
# q: long format of wide format dataset temp55.ts
q <- reshape(temp55.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(q)


ggplot(q, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 20, by = 2)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#009E73", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per quarter")

## Plot YEARLY aggregation

temp66 <- aggdata.yearly[which(aggdata.yearly$Source==sou[2] 
                               & aggdata.yearly$Target==tar[2]),] 
temp66.ts <- data.frame (Date=as.Date(rownames(temp66)), coredata(temp66))
# View(temp66.ts)
# y: long format of wide format dataset temp66.ts

y <- reshape(temp66.ts, 
             varying = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             v.names = "Counts",
             timevar = "Types", 
             times = c("Neutral", "VCoop", "MCoop", "VConf", "MConf"), 
             new.row.names = 1:1000,
             direction = "long")
# View(y)

ggplot(y, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 40, by = 5)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#009E73", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("Russia to Iraq events per year")

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
# https://people.duke.edu/~rnau/411arim3.htm

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
temptemp11.Neutral.mod <- arima (temptemp11.Neutral , order=c(2,0,0))
tsdiag(temptemp11.Neutral.mod)
Box.test(temptemp11.Neutral.mod$residuals)


temptemp12 <- aggdata2[which(aggdata2$Source==sou[1] 
                             & aggdata2$Target==tar[2]),] 
temptemp12.Neutral <- xts (temptemp12[,2], as.Date(temptemp12$Date, format='%m/%d/%Y'))
adf.test(temptemp12.Neutral)
temptemp12.Neutral.mod <- arima (temptemp12.Neutral , order=c(2,0,0))
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


#We can use auto.arima() there.  Recognize that it may suggest 
#overfitting or redundant roots in the model’s polynomial representation though.  
#So allow the user to input alternative ARIMA(p,d,q) choices.
#We might also give them the option of seeing the results from the tsdiag() 
#of the model to ensure that there is not residual serial correlation in their fitted model.

#Some kinds of events do have seasonality.  
#For example, protests in some regions of the world are highly seasonal 
#(e.g., labor protests in France are a good example). 
