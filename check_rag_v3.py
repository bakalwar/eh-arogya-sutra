import json, os
path = 'book/extracted/local_vector_index.json'
if os.path.exists(path):
    data = json.load(open(path, encoding='utf-8'))
    print(f'Chunk Count: {data.get("chunkCount")}')
    chunks = data.get("chunks", [])
    if chunks:
        print(f'Sample: {chunks[0].get("text","")[:100]}')
