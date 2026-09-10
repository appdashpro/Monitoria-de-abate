import urllib.request, re

url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote("Actinobacillus pleuropneumoniae index calculation SPES")
req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    print(html[:3000])
except Exception as e:
    print(e)
