# ── Etapa 1: build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Etapa 2: servidor Nginx ────────────────────────────────────
FROM nginx:alpine

# Copiar archivos estáticos generados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar plantilla de configuración de Nginx
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# Al arrancar, reemplaza ${API_URL} con la variable de entorno y lanza Nginx
CMD ["/bin/sh", "-c", "envsubst '${API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
