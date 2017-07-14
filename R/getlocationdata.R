# getdateplot.R
# short script to extract and write data to build the location plot

setwd("/Users/vjdorazio/Desktop/github/TwoRavens/R")

library(countrycode)
library(stringi)

## this is a good option to set...
options(stringsAsFactors = FALSE)

#read the data
data <- read.delim("../data/samplePhox.csv",sep=",")

data$cname <- data$AdminInfo
data$cname <- stri_trans_general(data$cname,"Latin-ASCII")

data$cname[which(data$cname=="United Kingdom of Great Britain and Northern Ireland")] <- "United Kingdom"
data$cname[which(nchar(data$cname)!=3)] <- countrycode(data$cname[which(nchar(data$cname)!=3)], "country.name", "iso3c", warn=TRUE)

data$freq <- 1

## aggregating
aggdata <- aggregate(data$freq, by=list(data$cname), FUN="sum")
colnames(aggdata) <- c("cname","freq")

aggdata$fullcname <- countrycode(aggdata$cname, "iso3c","country.name",warn=TRUE)

aggdata$id <- 1:nrow(aggdata)
aggdata <- aggdata[,c("id","cname","freq","fullcname")]

write.table(aggdata,"../data/locationplot.tsv", row.names=FALSE, quote=FALSE, sep="\t")
