#! usr/bin/python

#combines CAMEO and PETRARCH dictionaries

import re

mainURL = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/"

cameoFile = open(mainURL + "CAMEO_FULL_EDIT.txt", "r")
petrarchFile = open(mainURL + "from_PETRARCH/Petrarch_clean_dict_VALID.txt", "r")

cameoCodes = []
cameoData = []
for oline in cameoFile:
	line = oline.rstrip()
	cameoData.append(line)
	cameoCodes.append(line.split("\t")[0])

cameoFile.close()

toAddCodes = []
toAddData = []
for oline in petrarchFile:
	line = oline.rstrip()
	temp = line.split("\t")
	head = temp[0]
	end = temp[1]
	
	headTail = head[len(head)-3:]
	if (headTail not in cameoCodes):
		toAddCodes.append(headTail)
		toAddData.append(line)

petrarchFile.close()

toAddData.sort()
for l in toAddData:
	print(l + "\n")
print(len(toAddData))
print(len(toAddCodes))
print("done")
