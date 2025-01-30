FROM node:23

RUN mkdir app
WORKDIR app

COPY package.json package-lock.json .
RUN --mount=type=cache,target=/root/.npm npm ci

COPY src src
COPY public public

EXPOSE 3000/tcp

ENTRYPOINT ["yarn"]
CMD ["start"]
