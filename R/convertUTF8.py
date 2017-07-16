#! usr/bin/python

#code to remove non-UTF-8 characters from files; one of PETRARCH's dictionaries has invalid characters
#this probably does not work since Python treats UTF-8 differently than my editor for some reason

url = "/home/marcus/Documents/TwoRavens_Su17/Vito TwoRavens/data/dict_work/from_PETRARCH/"
fileOrig = open(url + "Petrarch_clean_dict_orig.txt", "r")

fileW = open(url + "Petrarch_valid_clean_dict.txt", "w")

print("decoding:")
x = 0
for line in fileOrig:
	#if (line.decode('utf-8', 'ignore').encode('utf-8') != line):
	#	print(x)
	#	print(line)
	
	try:
		line.decode('utf-8')
	except UnicodeError:
		print(x)
		print(line)	
	x += 1

fileOrig.close()
fileW.close()

print("done")
