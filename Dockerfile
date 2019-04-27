FROM nginx:latest as build


RUN apt-get install -y --no-install-suggests \
    nginx-module-njs
    
# Forward request logs to Docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
  && ln -sf /dev/stderr /var/log/nginx/error.log

RUN mkdir /etc/nginx/certs
COPY nginx.conf /etc/nginx/nginx.conf
COPY mqtt.js /etc/nginx/mqtt.js
COPY server.* /etc/nginx/certs/
COPY rootCA.crt /etc/nginx/certs/
# Create Director for Stream configuration files
RUN mkdir /etc/nginx/stream_conf.d
# COPY stream_mqtt*.conf /etc/nginx/stream.conf
COPY stream_mqtt*.conf /etc/nginx/stream_conf.d/ 

EXPOSE 8883 1883
