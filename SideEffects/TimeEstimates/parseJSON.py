import json

with open('historicalHelps.json') as f:
	data = json.load(f)

with open('simplifiedHistoricalHelps.txt', 'w+') as f:
	for obj in data['data']:
		f.write(obj['student_relation']['course']['course_number'])
		f.write('\t')
		f.write(obj['helper_assignment']['claim_time'])
		f.write('\t')
		f.write(obj['helper_assignment']['close_time'])
		f.write('\t')
		f.write(obj['problem_description'].replace('\n', ' '))
		f.write('\n')