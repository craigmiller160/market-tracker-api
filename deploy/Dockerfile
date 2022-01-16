FROM node:12.16.1

WORKDIR /usr/src/app

COPY build/mongo-k8s-bug-demo-*.tgz ./mongo-k8s-bug-demo.tgz
RUN tar xvf mongo-k8s-bug-demo.tgz
RUN cp -R package/* .
RUN rm -rf package

RUN npm set registry https://craigmiller160.ddns.net:30003/repository/npm-group/

RUN yarn

CMD ["yarn", "start:prod"]
