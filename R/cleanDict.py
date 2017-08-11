#! /usr/bin/python

#sorts all codes from CAMEO codebook into different files based on the length of their code: single (3 letters) and multiple (more than 3 letters)
#also applies uniqueness to the resulting files, does not check across both for similarities

urlBase = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/"
originFile = open(urlBase + "dict_work/all_tables_CAMEO", "r")
singleCodeFile = open(urlBase + "dict_work/single_code.txt", "w")
multCodeFile = open(urlBase + "dict_work/mult_code.txt", "w")

singleList = []
multList = []

for oline in originFile:
	line = oline.rstrip()
	k = line.rfind(" ")
	front = line[:k]
	end = line[k+1:len(line)]
	
	if (end.isupper() and len(end)%3 == 0 and "(" not in end):
		towrite = str(end + "\t" + front)
		if (len(end) == 3):
			singleList.append(towrite)
		else:
			multList.append(towrite)
	else:
		if ("\t" not in line):
			k = line.split(" ", 1)
			front = k[0]
			end = k[1]
			towrite = str(front + "\t" + end)
			if (len(front) == 3):
				singleList.append(towrite)
			else:
				multList.append(towrite)
		else:
			if (len(line.split("\t", 1)[0]) == 3):
				singleList.append(line)
			else:
				multList.append(towrite)
				
originFile.close()		

singleList = list(set(singleList))
multList = list(set(multList))
singleList.sort()
multList.sort()
				
for i in singleList:
	singleCodeFile.write("%s\n" %i)
	
for i in multList:
	multCodeFile.write("%s\n" %i)
	
singleCodeFile.close()
multCodeFile.close()

print("done")
