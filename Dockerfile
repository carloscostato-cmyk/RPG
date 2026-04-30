FROM node:20-alpine

WORKDIR /app

# Copy backend only
COPY backend/package*.json ./backend/
COPY shared ./shared
COPY backend/src ./backend/src

# Install backend dependencies only
RUN cd backend && npm install

# Build backend only
RUN cd backend && npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "start"]
