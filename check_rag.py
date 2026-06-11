import json, os, glob
path = 'book/extracted/local_vector_index.json'
if os.path.exists(path):
    data = json.load(open(path, encoding='utf-8'))
    print(f'Chunks: {len(data)}')
    if len(data) > 0:
        print(f'Sample: {data[0].get("text","")[:100]}')
else:
    print('INDEX FILE NOT FOUND')
    print('Looking for file...')
    files = glob.glob('**/*vector*', recursive=True)
    print(files)
