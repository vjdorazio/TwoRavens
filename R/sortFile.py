#! usr/bin/python

#sorts a file alphabetically since my editor lacks that functionality

url = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/"
fileR = open(url + "dict_work/CAMEO_FULL_EDIT.txt", "r")

data = []
for l in fileR:
	data.append(l.rstrip())

data.sort()

fileR.close()

fileW = open(url + "dict_sorted.txt", "w")
for l in data:
		fileW.write("%s\n" %l)
print("done")
