library(ggplot2)
library(dplyr)
library(data.table) # for rbindlist and fread library(stringr)
library(lubridate)
#library(xtable)
library(scales) # for fancy date scales in ggplot library(countrycode)
library(xts)
library(tseries)
library(forecast)

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
df <- data.frame(cbind(ss$Date,ss$Source,ss$Target,ss$QuadClass),stringsAsFactors=FALSE)
colnames(df) <- c("Date", "sou", "tar", "QuadClass")

aggdata <- df%>%
  group_by(Date,sou,tar, QuadClass)%>%
  summarise(count=n())%>%
  spread(QuadClass,count)
aggdata[is.na(aggdata)] <- 0
colnames(aggdata) <- c("Date", "Source", "Target", "Neutral", "VCoop", "MCoop", "VConf", "MConf")

library(lubridate)
aggdata.ts <- data.frame (Date=ymd(aggdata$Date), coredata(aggdata))
aggdata.ts <- aggdata.ts[,-2]
aggdata.ts.sorted.day <- aggdata.ts[order(aggdata.ts$Date),] # sorted event by Date order
aggdata.ts.sorted.day <- aggdata.ts.sorted.day[,c(1,4,5,6,7,8,2,3)]
#View(aggdata.ts.sorted.day)

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

aggdata.weekly.ts <- data.frame (Date=as.Date(rownames(aggdata.weekly)), coredata(aggdata.weekly)) 
View(aggdata.weekly.ts)

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
#View(aggdata.quarterly.ts)

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

## Plot QUARTERLY aggregation

temp55 <- aggdata.quarterly[which(aggdata.quarterly$Source==sou[1] 
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
View(q)


ggplot(q, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 5, by = 1)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#56B4E9", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("USA Govt to Iraq events per quarter")

## Plot YEARLY aggregation

temp66 <- aggdata.yearly[which(aggdata.yearly$Source==sou[1] 
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
View(y)

ggplot(y, aes(x=Date, y=Counts, color = Types)) +
  geom_line(size=0.5, alpha=0.8)+theme_bw() +
  scale_x_date(breaks = date_breaks("3 months"),
               labels = date_format("%b %y")) +
  scale_y_continuous(breaks = seq(0, 5, by = 1)) +
  scale_color_manual(values=c( "Neutral"="#0072B2", "VCoop"="#56B4E9", 
                               "MCoop"="#009E73", "VConf"="#CC79A7", 
                               "MConf"="#D55E00")) +
  ylab("Number of events") +
  xlab("Date") + 
  theme(strip.background = element_rect(fill = 'white')) +
  ggtitle("USA Govt to Iraq events per year")

###########