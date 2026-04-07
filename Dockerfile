FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript
RUN npx tsc
EXPOSE 3003
CMD ["node", "dist/tickets/tickets.controller.js"]