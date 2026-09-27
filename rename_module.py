import os
import glob

old_dir = 'src/modules/search'
new_dir = 'src/modules/web-search-api'

os.rename(old_dir, new_dir)
os.rename(f'{new_dir}/dto/search.dto.ts', f'{new_dir}/dto/web-search-api.dto.ts')
os.rename(f'{new_dir}/search.controller.ts', f'{new_dir}/web-search-api.controller.ts')
os.rename(f'{new_dir}/search.service.ts', f'{new_dir}/web-search-api.service.ts')
os.rename(f'{new_dir}/search.module.ts', f'{new_dir}/web-search-api.module.ts')

# Update web-search-api.module.ts
with open(f'{new_dir}/web-search-api.module.ts', 'r') as f:
    content = f.read()
content = content.replace("SearchController", "WebSearchApiController")
content = content.replace("SearchService", "WebSearchApiService")
content = content.replace("SearchModule", "WebSearchApiModule")
content = content.replace("./search.controller.js", "./web-search-api.controller.js")
content = content.replace("./search.service.js", "./web-search-api.service.js")
with open(f'{new_dir}/web-search-api.module.ts', 'w') as f:
    f.write(content)

# Update web-search-api.controller.ts
with open(f'{new_dir}/web-search-api.controller.ts', 'r') as f:
    content = f.read()
content = content.replace("SearchController", "WebSearchApiController")
content = content.replace("SearchService", "WebSearchApiService")
content = content.replace("searchService", "webSearchApiService")
content = content.replace("./search.service.js", "./web-search-api.service.js")
content = content.replace("./dto/search.dto.js", "./dto/web-search-api.dto.js")
with open(f'{new_dir}/web-search-api.controller.ts', 'w') as f:
    f.write(content)

# Update web-search-api.service.ts
with open(f'{new_dir}/web-search-api.service.ts', 'r') as f:
    content = f.read()
content = content.replace("SearchService", "WebSearchApiService")
content = content.replace("./dto/search.dto.js", "./dto/web-search-api.dto.js")
with open(f'{new_dir}/web-search-api.service.ts', 'w') as f:
    f.write(content)

# Update app.module.ts
with open('src/app.module.ts', 'r') as f:
    content = f.read()
content = content.replace("SearchModule", "WebSearchApiModule")
content = content.replace("./modules/search/search.module.js", "./modules/web-search-api/web-search-api.module.js")
with open('src/app.module.ts', 'w') as f:
    f.write(content)

