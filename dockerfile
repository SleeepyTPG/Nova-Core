# Basisimage mit Node.js
FROM node:20-alpine

# Arbeitsverzeichnis im Container
WORKDIR /app

# package.json und package-lock.json zuerst kopieren (wegen Docker Cache)
COPY package*.json ./

# Dependencies installieren
RUN npm install --production

# Restlichen Code kopieren
COPY . .

# Bot starten
CMD ["node", "bot.js"]