#getactors.RT
#script to grab unique sources/targets and their attributes (roles, entities, etc)

url = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data"

#read only the columns with source and target, skip the title row
data <- read.table(paste(url, "/samplePhox.csv", sep=""), sep=",", colClasses=c(rep("NULL", 7), rep("character", 8), rep("NULL", 28-15)), skip=1)

#sources
datacol1 = unique(data[[1]])
datacol2 = unique(data[[2]])
datacol3 = unique(data[[3]])
datacol4 = data[[4]]

#targets
datacol5 = unique(data[[5]])
datacol6 = unique(data[[6]])
datacol7 = unique(data[[7]])
datacol8 = data[[8]]

#finds all unique attributes for source
#datacol4 = strsplit(datacol4, ";")				#splits multiple attributes
#datacol4 = datacol4[lapply(datacol4, length) > 0]		#removes empty entries
#datacol4 = unlist(datacol4, recursive=F)			#flattens list
#datacol4 = unique(datacol4)					#stores only unique elements

datacol4 = sort(unique(unlist(strsplit(data[[4]], ";")[lapply(data[[4]], length) > 0], recursive=FALSE)))		#combines above steps into one command

#same for target attributes
datacol8 = sort(unique(unlist(strsplit(data[[8]], ";")[lapply(data[[8]], length) > 0], recursive=FALSE)))

datacol1 = sort(datacol1[datacol1 != ""])
datacol2 = sort(datacol2[datacol2 != ""])
datacol3 = sort(datacol3[datacol3 != ""])
datacol5 = sort(datacol5[datacol5 != ""])
datacol6 = sort(datacol6[datacol6 != ""])
datacol7 = sort(datacol7[datacol7 != ""])

#output each column to their seperate csv file
write.table(datacol1, file = paste(url, "/sourceFull.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol2, file = paste(url, "/sourceEntity.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol3, file = paste(url, "/sourceRole.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol4, file = paste(url, "/sourceAttr.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol5, file = paste(url, "/targetFull.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol6, file = paste(url, "/targetEntity.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol7, file = paste(url, "/targetRole.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
write.table(datacol8, file = paste(url, "/targetAttr.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)
