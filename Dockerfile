FROM armv7/armhf-debian

#RUN apt-get update && apt-get -y upgrade 
#RUN apt-get -y install build-essential nodejs npm
#RUN apt-get autoremove && apt-get clean
RUN apt-get update && apt-get -y upgrade && apt-get -y install build-essential nodejs npm && apt-get autoremove && apt-get clean

RUN mkdir /node-bravia
WORKDIR /node-bravia
COPY package.json .
RUN npm install
COPY . .

EXPOSE 5006

CMD ["nodejs", "http-bravia-echo.js"]
