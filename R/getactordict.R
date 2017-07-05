#getactors.RT
#script to grab unique sources/targets and their attributes (roles, entities, etc), then output only unique entries to form part 1 of dictionary
#adapted from 'getactors.R'

url = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data"

#read only the columns with source and target, skip the title row
data <- read.table(paste(url, "/samplePhox.csv", sep=""), sep=",", colClasses=c(rep("NULL", 7), rep("character", 8), rep("NULL", 28-15)), skip=1)

#sources
#datacol1 = unique(data[[1]])		#dont need this because it is the full source
datacol2 = unique(data[[2]])
datacol3 = unique(data[[3]])
datacol4 = data[[4]]

#targets
#datacol5 = unique(data[[5]])		#dont need this because it is the full target
datacol6 = unique(data[[6]])
datacol7 = unique(data[[7]])
datacol8 = data[[8]]

#finds all unique attributes for source
#datacol4 = strsplit(datacol4, ";")				#splits multiple attributes
#datacol4 = datacol4[lapply(datacol4, length) > 0]		#removes empty entries
#datacol4 = unlist(datacol4, recursive=F)			#flattens list
#datacol4 = unique(datacol4)					#stores only unique elements

datacol4 = unique(unlist(strsplit(data[[4]], ";")[lapply(data[[4]], length) > 0], recursive=FALSE))		#combines above steps into one command

#same for target attributes
datacol8 = unique(unlist(strsplit(data[[8]], ";")[lapply(data[[8]], length) > 0], recursive=FALSE))

datacol2 = sort(datacol2[datacol2 != ""])
datacol3 = sort(datacol3[datacol3 != ""])
datacol6 = sort(datacol6[datacol6 != ""])
datacol7 = sort(datacol7[datacol7 != ""])

outputData = c(datacol2, datacol3, datacol4, datacol6, datacol7, datacol8)
outputData = unique(outputData)
outputData = sort(outputData[outputData != ""])

#output
write.table(outputData, file = paste(url, "/CAMEO_actor_dict.csv", sep=""), quote = FALSE, row.names=FALSE, col.names=FALSE)

print("complete")

print(paste("datacol2: ", length(datacol2)))
print(datacol2)
print(paste("datacol3: ", length(datacol3)))
print(datacol3)
print(paste("datacol4: ", length(datacol4)))
print(datacol4)
print(paste("datacol6: ", length(datacol6)))
print(datacol6)
print(paste("datacol7: ", length(datacol7)))
print(datacol7)
print(paste("datacol8: ", length(datacol8)))
print(datacol8)
print(paste("outpuData: ", length(outputData)))
print(outputData)
