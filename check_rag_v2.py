import json, os
path = 'book/extracted/local_vector_index.json'
if os.path.exists(path):
    data = json.load(open(path, encoding='utf-8'))
    print(f'Type: {type(data)}')
    if isinstance(data, dict):
        print(f'Keys: {list(data.keys())[:5]}')
        first_key = list(data.keys())[0]
        print(f'Sample from {first_key}: {str(data[first_key])[:100]}')
    elif isinstance(data, list):
        print(f'Length: {len(data)}')
        print(f'Sample: {str(data[0])[:100]}')
