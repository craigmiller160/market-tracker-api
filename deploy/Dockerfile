FROM node:16.3.0

WORKDIR /usr/src/app

COPY build/market-tracker-api-*.tgz ./market-tracker-api.tgz
RUN tar xvf market-tracker-api.tgz
RUN cp -R package/* .
RUN rm -rf package

RUN npm set registry https://nexus-craigmiller160.ddns.net/repository/npm-group/

RUN NODE_ENV=production yarn install --production

CMD ["yarn", "start:prod"]
