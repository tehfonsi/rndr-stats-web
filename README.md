# Build docker

docker build -t rndr-stats-web .

docker run -p 8080:3000 -e NUXT_DB_PASSWORD="your_password_here" rndr-stats-web