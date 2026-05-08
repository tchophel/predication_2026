FROM python:3.11

WORKDIR /code
ENV PYTHONPATH=/code

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y curl netcat-openbsd && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Build React
WORKDIR /code/frontend
RUN npm install
RUN npm run build

# Move build to Django static
RUN mkdir -p /code/staticfiles && cp -r build/* /code/staticfiles/

WORKDIR /code

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]