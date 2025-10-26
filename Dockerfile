FROM node:24-alpine

WORKDIR /app

COPY package.json .
RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm dlx prisma generate

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run","dev"]
