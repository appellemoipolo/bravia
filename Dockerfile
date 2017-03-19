# docker build -t appellemoipolo/bravia-node-service .
# docker run -d -p 5006:5006 --env SONY_TV_IP=ip-or-tv-name --env SONY_TV_PSKKEY=tv-pskkey --name bravia-service appellemoipolo/bravia-node-service
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
