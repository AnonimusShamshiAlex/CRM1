FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Скачиваем шрифты DejaVuSans для кириллицы в PDF
RUN mkdir -p fonts && \
    curl -L -o fonts/DejaVuSans.ttf "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf" && \
    curl -L -o fonts/DejaVuSans-Bold.ttf "https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf"

EXPOSE 5000

CMD ["node", "src/index.js"]