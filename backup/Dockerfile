FROM alpine:latest

# Install required packages
RUN apk add --no-cache \
    mysql-client \
    aws-cli \
    gzip \
    tar \
    curl \
    bash

# Create backup user
RUN addgroup -g 1000 backup && \
    adduser -D -s /bin/bash -u 1000 -G backup backup

# Create backup directory
RUN mkdir -p /backups && chown backup:backup /backups

# Copy backup script
COPY backup.sh /backup.sh
RUN chmod +x /backup.sh && chown backup:backup /backup.sh

# Switch to backup user
USER backup

# Set working directory
WORKDIR /backups

# Default command
CMD ["/backup.sh"]