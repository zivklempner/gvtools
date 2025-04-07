# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Install system dependencies for building Python packages (like pycairo)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libcairo2-dev \
        pkg-config \
        python3-dev \
        libgirepository1.0-dev \
        gir1.2-gtk-3.0 \
        ca-certificates \
        && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the app port
EXPOSE 8080

# Define environment variable
ENV NAME GVTools

# Run app.py when the container launches
CMD ["python", "app.py"]


