import json

with open('historicalHelps.json') as f:
	data = json.load(f)

with open('simplifiedHistoricalHelps.txt', 'w+') as f:
	for obj in data['data']:
		classNumber = obj['student_relation']['course']['course_number']
		if classNumber == '106a': f.write('CS106A')
		elif classNumber == '106b': f.write('CS106B')
		elif classNumber == '106x': f.write('CS106X')
		else: continue
		f.write('\t')
		f.write(obj['helper_assignment']['claim_time'])
		f.write('\t')
		f.write(obj['helper_assignment']['close_time'])
		f.write('\t')
		f.write(obj['problem_description'].replace('\n', ' ').lower())
		f.write('\n')