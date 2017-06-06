# getdateplot.R
# short script to extract and write data to build the date plot

setwd("/Users/vjdorazio/Desktop/github/TwoRavens/R")

#read the data
data <- read.delim("../data/samplePhox.csv",sep=",")


#substring the year and month part of the date, and extract the column 
data.date <- substr(data$Date,1,6)


dateplot <- as.data.frame(table(data.date))

#change column names

colnames(dateplot)<-c("Date","Freq")


#this is the code you sent, but this doesnt seem to work with this table
dateplot$Date <- as.character(dateplot$Date)
dateplot$datestr<- paste(substr(dateplot$Date,1,4), substr(dateplot$Date,5,6), '01', sep="-")
dateplot$newDate <- as.Date(dateplot$datestr, "%Y-%m-%d")
dateplot <- dateplot[order(dateplot$newDate),]
dateplot$Date <- format(dateplot$newDate, format="%b %Y")
out <- dateplot[,c("Date","Freq")]
write.csv(out,"../data/dateplot.csv", row.names=FALSE)
