FROM node:17-alpine3.14
WORKDIR /usr/app/
COPY . .

RUN npm install 
