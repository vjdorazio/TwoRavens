#! usr/bin/python

#compares difference between code contents in my CAMEO dictionary and the codes pulled from samplePhox.csv

urlBase = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/"

cameoDict = open(urlBase + "CAMEO_FULL_EDIT.txt", "r")
myDict = open(urlBase + "CAMEO_actor_dict_1.csv", "r")

codes = []
for l in cameoDict:
	head = l.split("\t")[0]
	codes.append(head[len(head)-3:])
	
cameoDict.close()

for l in myDict:
	if (l.split('\t')[0] not in codes):
		print(l.split('\t')[0])
		
myDict.close()
print("done")
