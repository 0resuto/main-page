FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_GITHUB_USERNAME=0resuto
ARG NEXT_PUBLIC_PHONE
ARG NEXT_PUBLIC_PHONE_LINK
ARG NEXT_PUBLIC_EMAIL
ENV NEXT_PUBLIC_GITHUB_USERNAME=$NEXT_PUBLIC_GITHUB_USERNAME
ENV NEXT_PUBLIC_PHONE=$NEXT_PUBLIC_PHONE
ENV NEXT_PUBLIC_PHONE_LINK=$NEXT_PUBLIC_PHONE_LINK
ENV NEXT_PUBLIC_EMAIL=$NEXT_PUBLIC_EMAIL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next

RUN npm ci --omit=dev

USER node

EXPOSE 3000
CMD ["npm", "start"]
