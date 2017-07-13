#! /usr/bin/python

urlBase = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/from_PETRARCH/"

code = []
translations = []

def listDup(item):
	start = -1
	locs = []
	while True:
		try:
			loc = code.index(item, start+1)
		except ValueError:
			break
		else:
			locs.append(loc)
			start = loc
	return locs
	
def	words(fileobj):
	for oline in fileobj:
		line = oline.rstrip().split("#", 1)[0].split("<!", 1)[0]
		if (line == ""):
			continue
		line = line.rstrip()
		for w in line.split():
			if (">" in w or "<" in w or any(char.isdigit() for char in w)):
				break
			else:
				yield w

for a in range(3):
	fileM = 0
	if (a == 0):
		fileM = open(urlBase + "Phoenix.Countries.actors.txt", "r")
	elif (a== 1):
		fileM = open(urlBase + "Phoenix.International.actors.txt", "r")
	else:
		fileM = open(urlBase + "Phoenix.MilNonState.actors.txt", "r")

	fileR = words(fileM)
	added = False
	translateList = []
	for w in fileR:			#parse words of file
		if (w[:1] == "+"):
			translateList.append(w[1:])
			continue
		else:
			if (w[:1] == "["):
				end = w[1:].split("]")[0]
				code.append(end)
				if (added):
					added = False
					translations.append(translateList)
				else:
					translations.append(translateList)
			else:
				translateList = []
				added = True
				translateList.append(w)
	fileM.close()

print(len(code))
print(len(translations))

i = 0
while i < len(code):
	dups = listDup(code[i])
	transHead = dups.pop(0)
	if (len(dups) > 0):
		for x in reversed(dups):
			#print("del: " + str(x))
			#print(str(code[i]) + "|||" + str(translations[i]) + "|||" + str(dups[x]))
			del code[x]
			#translations[dups[0]] += str(", " + translations.pop(x))
			old = translations.pop(x)
			#print(old)
			translations[transHead].extend(old)
			#print(translations[transHead])
	i += 1
		
print(len(code))
print(len(translations))

for i in translations:
	i = list(set(i))
	
print(len(code))
print(len(translations))

fileW = open(urlBase + "Petrarch_clean_dict.txt", "w")
i = 0
while i < len(code):
	fileW.write("%s\t" %code[i])
	if (len(code[i]) == 3):
		print(code[i])
	for j in translations[i]:
		fileW.write("%s " %j)
	fileW.write("\n")
	i += 1
fileW.close()
print("done")
print("done")
