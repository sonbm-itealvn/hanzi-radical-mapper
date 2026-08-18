import urllib.request
import re
import json

url = 'https://vi.wikipedia.org/wiki/Danh_s%C3%A1ch_b%E1%BB%99_th%E1%BB%A7_Khang_Hy'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# The table has rows like:
# <tr><td>1</td><td><a ...>?</a></td><td>nh?t</td><td>yi</td><td>m?t</td></tr>

pattern = re.compile(r'<tr>\s*<td>(\d+)</td>\s*<td>.*?>(.)</a>.*?</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>', re.IGNORECASE)
matches = pattern.findall(html)

radicals = {}
for m in matches:
    num, char, vi_name, pinyin, meaning = m
    # Clean up html tags inside if any
    vi_name = re.sub(r'<[^>]+>', '', vi_name).strip()
    pinyin = re.sub(r'<[^>]+>', '', pinyin).strip()
    meaning = re.sub(r'<[^>]+>', '', meaning).strip()
    char = re.sub(r'<[^>]+>', '', char).strip()
    
    # some pinyin/meaning might have sup tags or multiple items, take first part
    vi_name = vi_name.split('<')[0].strip()
    pinyin = pinyin.split('<')[0].strip()
    
    radicals[char] = {
        'pinyin': pinyin,
        'vi': vi_name,
        'meaning': meaning
    }

print(json.dumps(radicals, ensure_ascii=False, indent=2))
