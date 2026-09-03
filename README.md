# City API Prototype

CRUD REST de ciudades con Node.js 24, Express 5, Supabase e Infisical.

## Endpoints

- `GET /health`
- `POST /api/cities`
- `GET /api/cities`
- `GET /api/cities/:id`
- `PUT /api/cities/:id`
- `DELETE /api/cities/:id`

## Crear ciudad

```json
{
  "name": "Ica",
  "country": "Peru"
}
```

No existe regla de longitud mínima de 3 caracteres. Solo se rechazan valores `null`, ausentes, no string o vacíos.

## Supabase

Ejecutar `schema.sql` en el SQL Editor de Supabase.

Variables requeridas:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ROW` (opcional, default 10)
- `PORT` (opcional, default 3000)

## Local con Infisical

```bash
npm install
infisical run --env=dev -- npm run dev
```

La aplicación solo lee `process.env`; no está acoplada al SDK de Infisical.

## Local sin Infisical, solo para prueba rápida

Copiar `.env.example` a `.env` y exportar las variables manualmente antes de ejecutar Node. El proyecto no carga `.env` automáticamente para evitar agregar otra dependencia.

## Ejemplos curl

```bash
curl http://localhost:3000/health
```

```bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -d '{"name":"Ica","country":"Peru"}'
```

```bash
curl http://localhost:3000/api/cities
```

## VM pequeña sin Docker

La carpeta `deploy/` incluye un ejemplo de unidad `systemd`.

Ruta sugerida:

```text
/opt/city-api
```

Crear usuario del servicio:

```bash
sudo useradd --system --home /opt/city-api --shell /usr/sbin/nologin cityapi
sudo mkdir -p /opt/city-api
sudo chown -R cityapi:cityapi /opt/city-api
```

Después de copiar el proyecto:

```bash
cd /opt/city-api
npm ci --omit=dev
```

Registrar servicio:

```bash
sudo cp deploy/city-api.service /etc/systemd/system/city-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now city-api
sudo systemctl status city-api
```

Logs:

```bash
journalctl -u city-api -f
```

## Nota sobre 256 MB RAM

Se evita Docker y PM2. `systemd` administra el proceso directamente. La unidad incluye `MemoryMax=180M` como protección inicial; ajústalo después de medir consumo real.
