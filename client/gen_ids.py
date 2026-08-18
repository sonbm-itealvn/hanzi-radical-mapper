import urllib.request
import re
import json

url = 'https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
except Exception as e:
    print(e)
    html = ''

# The file format is: U+59D0	?	???
# We want to map '?' to '???'

lines = html.split('\n')
mapping = {}
for line in lines:
    if not line or line.startswith('#'): continue
    parts = line.split('\t')
    if len(parts) >= 3:
        char = parts[1]
        ids = parts[2]
        mapping[char] = ids

with open('public/ids.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False)

print('Generated ids.json with', len(mapping), 'entries')
