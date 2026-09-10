import urllib.request, urllib.parse, re

url = "https://www.bing.com/search?q=" + urllib.parse.quote("APPI Actinobacillus pleuropneumoniae index calculation")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    text = re.sub(r'<[^>]+>', '\n', html)
    print([line.strip() for line in text.split('\n') if 'APPI' in line or 'calculation' in line or 'index' in line][:20])
except Exception as e:
    pass
