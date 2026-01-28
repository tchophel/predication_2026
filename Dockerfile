FROM python:3.11

WORKDIR /code

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Install netcat for health checks and Node.js for React frontend
RUN apt-get update && apt-get install -y curl netcat && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install and build React frontend
WORKDIR /code/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Move built frontend to Django static files
RUN mkdir -p ../staticfiles && cp -r build/* ../staticfiles/

WORKDIR /code

# Copy entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
