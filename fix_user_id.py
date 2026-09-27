# Fix chat.controller.ts
with open('src/modules/chat/chat.controller.ts', 'r') as f:
    content = f.read()

content = content.replace("userId: string;", "id: string;")
content = content.replace("req.user.userId", "req.user.id")

with open('src/modules/chat/chat.controller.ts', 'w') as f:
    f.write(content)

# Fix web-search-api.controller.ts
with open('src/modules/web-search-api/web-search-api.controller.ts', 'r') as f:
    content = f.read()

content = content.replace("userId: string;", "id: string;")
content = content.replace("req.user.userId", "req.user.id")

with open('src/modules/web-search-api/web-search-api.controller.ts', 'w') as f:
    f.write(content)

