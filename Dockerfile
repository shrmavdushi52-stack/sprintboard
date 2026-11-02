FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
EXPOSE 80
