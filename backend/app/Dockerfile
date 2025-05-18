FROM public.ecr.aws/bitnami/node:18

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --prod

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

ENV PORT=3001
EXPOSE 3001

CMD ["node", "build/server.js"] 