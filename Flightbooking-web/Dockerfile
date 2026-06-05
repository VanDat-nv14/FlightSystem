FROM node:20-alpine

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

EXPOSE 5173

# Chạy Vite dev server, bind ra 0.0.0.0 để Docker có thể expose ra ngoài
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
