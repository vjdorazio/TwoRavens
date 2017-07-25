#! usr/bin/python

#combines CAMEO and PETRARCH dictionaries

mainURL = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/"

cameoFile = open(mainURL + "CAMEO_FULL_SORTED.txt", "r")
petrarchFile = open(mainURL + "from_PETRARCH/Petrarch_clean_dict.txt", "r")

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

	if (headTail == "UNR" or headTail == "OCC" or headTail == "GRB" or headTail == "KNT" or headTail == "---"):
		continue
	
	if (head not in cameoCodes):
		if (headTail not in cameoCodes):
			toAddCodes.append(head)
			toAddData.append(line)
	
	if (headTail not in cameoCodes):
		toAddCodes.append(headTail)
		toAddData.append(line)

petrarchFile.close()

toAddCodes = list(set(toAddCodes))
toAddData = list(set(toAddData))
toAddData.sort()
toAddCodes.sort()
print("DATA:")
for l in toAddData:
	print(l + "\n")
print("CODES:")
for c in toAddCodes:
	print(c + "\n")
print(len(toAddData))
print(len(toAddCodes))

print("confirm write?: ")
choice = raw_input("y/n: ").upper()
if (choice == "Y"):
	finalData = []
	c = 0
	while c < len(toAddData):
		print("\nThis is the PETRARCH info for " + toAddData[c])
		choice = raw_input("Enter translation (hit return for no translation): ")
		if (choice == ""):
			print("no translation found")
			finalData.append(toAddData[c].split("\t")[0] + "\tno translation found")
		else:
			finalData.append(toAddData[c].split("\t")[0] + "\t" + choice.rstrip())
		c += 1

	print("adding following to dictionary:")
	for i in finalData:
		cameoData.append(i)
		print(i)
		head = i.split("\t")[0]
		if (len(head) == 3):
			continue
		head = head[len(head)-3:]
		toAdd = (head + "\t" + i.split("\t", 1)[1])
		print(toAdd)
		cameoData.append(toAdd)

	print(len(cameoData))
	cameoData = list(set(cameoData))
	cameoData.sort()
	print(len(cameoData))
	writeFile = open(mainURL + "dict_sorted.txt", "w")
	for l in cameoData:
		writeFile.write("%s\n" %l);
	writeFile.close()
else:
	print("aborting")

print("done")
