FROM node:16.3.0

WORKDIR /usr/src/app

COPY build/market-tracker-api-*.tgz ./market-tracker-api.tgz
RUN tar xvf market-tracker-api.tgz
RUN cp -R package/* .
RUN rm -rf package

CMD ["node", "index.js"]
