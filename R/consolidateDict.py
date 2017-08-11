#! usr/bin/python

#combines CAMEO single and multiple codes into one file, gives user options to choose from which translation
#note that the "mark" option requires manual editing after execution: lines marked begin with "!!!"

urlBase = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/"

singleCode = open(urlBase + "single_code.txt", "r")
multCode = open(urlBase + "mult_code.txt", "r")

codes = []
output = []
multLines = []

for l in singleCode:
	line = l.rstrip()
	codes.append(line[:3])
	output.append(line)
	
for l in multCode:
	line = l.strip()
	output.append(line)
	multLines.append(line)
	
singleCode.close()
multCode.close()
		
output.sort()
print(output)
x = 1
print("checking dup")
while (x < len(output)):
	if (output[x].split("\t")[0] == output[x-1].split("\t")[0]):
		while(True):
			print("choose 1 or 2:")
			print("1: " + output[x-1])
			print("2: " + output[x])
			print("3: keep both and mark")
			choice = raw_input("Choice: ")
			print("\n")
			if (choice == '1'):
				output.pop(x)
				x -= 1
				break
			elif (choice == '2'):
				output.pop(x-1)
				x-= 1
				break
			elif (choice == '3'):
				output[x-1] = "!!!\t" + output[x-1]
				output[x] = "!!!\t" + output[x]
				break
			elif (choice == '4'):
				break
	x += 1
	
print("adding into codes")
x = 0
while (x < len(multLines)):
	k = multLines[x].split("\t")
	head = k[0]
	if (head != "!!!"):
		head = head[len(head)-3:]
		end = k[1]
	
		if (head not in codes):
			codes.append(head)
			output.append(head + "\t" + end)
	x += 1
		
output.sort()
x = 1
print("checking dup second")
while (x < len(output)):
	if not(output[x-1][:3] == "!!!" or output[x][:3] == "!!!"):
		if (output[x].split("\t")[0] == output[x-1].split("\t")[0]):
			while(True):
				print("choose 1 or 2:")
				print("1: " + output[x-1])
				print("2: " + output[x])
				print("3: keep both and mark")
				choice = raw_input("Choice: ")
				print("\n")
				if (choice == '1'):
					output.pop(x)
					x -= 1
					break
				elif (choice == '2'):
					output.pop(x-1)
					x-= 1
					break
				elif (choice == '3'):
					output[x-1] = "!!!\t" + output[x-1]
					output[x] = "!!!\t" + output[x]
					break
	x += 1
	
outFile = open(urlBase + "CAMEO_FULL.txt", "w")
for l in output:
	outFile.write("%s\n" %l)

outFile.close()	
print("done")
