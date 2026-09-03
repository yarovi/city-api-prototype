# City API Prototype --- Guía de configuración y despliegue

> Referencia del laboratorio realizado con **Node.js + Express +
> Supabase + Infisical + Google Compute Engine + systemd**.

## 1. Arquitectura final

``` text
Bruno / Postman
      |
      | HTTP :3000
      v
Google Cloud Firewall
      |
      v
Google Compute Engine VM (Debian)
      |
      v
systemd
      |
      v
Infisical CLI
      |
      | Machine Identity + Universal Auth
      v
Node.js + Express
      |
      v
Supabase → public.city
```

No usamos Docker porque la VM tiene recursos muy limitados y para este
prototipo no era necesario.

## 2. Herramientas

  Herramienta               Uso
  ------------------------- ------------------------------
  Node.js 24                Runtime
  Express                   API REST
  Supabase                  PostgreSQL administrado
  `@supabase/supabase-js`   Cliente Supabase
  Infisical                 Gestión de secretos
  Infisical CLI             Inyección de secretos
  Machine Identity          Identidad de la VM
  Universal Auth            Autenticación no interactiva
  Google Compute Engine     VM Debian
  `gcloud`                  SSH, VM y firewall
  systemd                   Mantener la API ejecutándose
  Bruno/Postman             Pruebas HTTP
  Git                       Versionado

## 3. Estructura del proyecto

``` text
city-api-prototype/
├── deploy/
├── src/
│   ├── config/
│   │   ├── env.js
│   │   └── supabase.js
│   ├── controllers/
│   │   └── cityController.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── repositories/
│   │   └── cityRepository.js
│   ├── routes/
│   │   └── cityRoutes.js
│   ├── services/
│   │   └── cityService.js
│   ├── app.js
│   └── server.js
├── package.json
├── package-lock.json
├── schema.sql
└── technical.md
```

Flujo:

``` text
Route → Controller → Service → Repository → Supabase
```

## 4. Tabla Supabase

``` sql
CREATE TABLE public.city (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    moddate TIMESTAMPTZ
);
```

Verificación:

``` sql
SELECT * FROM public.city;
```

El error
`Could not find the 'country' column of 'city' in the schema cache`
significaba que la tabla existía pero su estructura no coincidía con el
código.

## 5. Supabase: claves

`sb_publishable_...` es una **Publishable Key** y queda sometida a RLS.

El error:

``` text
new row violates row-level security policy for table "city"
```

apareció porque inicialmente usamos esa key.

Para el backend usamos una Secret Key:

``` text
sb_secret_...
```

guardada en Infisical como:

``` text
SUPABASE_SECRET_KEY
```

Nunca debe exponerse en frontend, Git o documentación pública.

## 6. Infisical en desarrollo

Los secretos viven en Infisical. El código sigue leyendo normalmente:

``` javascript
process.env.SUPABASE_URL
process.env.SUPABASE_SECRET_KEY
process.env.ROW
```

Para iniciar localmente:

``` bash
infisical run --env=dev -- npm run dev
```

Prueba:

``` bash
infisical run --env=dev -- node -e "console.log(process.env.ROW)"
```

Si usamos Infisical, no necesitamos un `.env` con secretos para ejecutar
la aplicación.

## 7. Machine Identity

En la VM evitamos depender de un login humano:

``` text
VM
 ↓
Machine Identity
 ↓
Universal Auth
 ↓
Client ID + Client Secret
 ↓
Access Token temporal
 ↓
Infisical
```

La Machine Identity se configura en Infisical, no dentro del proyecto
Node.

Conceptualmente:

``` text
Client ID + Client Secret → autenticación: ¿quién eres?
Rol del proyecto          → autorización: ¿qué puedes leer?
```

Debe tener solamente los permisos necesarios para leer los secretos del
proyecto/entorno.

## 8. Prueba manual de Universal Auth

``` bash
export INFISICAL_CLIENT_ID='...'
export INFISICAL_CLIENT_SECRET='...'
export INFISICAL_PROJECT_ID='...'
```

Obtener token:

``` bash
export MY_TOKEN=$(infisical login \
  --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" \
  --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent \
  --plain)
```

Comprobar que existe sin mostrarlo:

``` bash
echo ${#MY_TOKEN}
```

Probar secretos:

``` bash
infisical run \
  --token="$MY_TOKEN" \
  --projectId="$INFISICAL_PROJECT_ID" \
  --env=dev \
  -- node -e 'console.log(process.env.ROW)'
```

Cuando vimos
`Injecting 8 Infisical secrets into your application process`, quedó
validada la integración.

## 9. Google Compute Engine

Conexión desde Windows:

``` powershell
gcloud compute ssh --zone "ZONA" "NOMBRE_VM" --project "PROJECT_ID_GCP"
```

Cuando aparece `usuario@instance:~$`, los comandos se están ejecutando
dentro de Debian.

Diagnóstico:

``` bash
cat /etc/os-release
free -h
df -h
```

Paquetes básicos:

``` bash
sudo apt update
sudo apt install -y git curl
```

Comprobar Node:

``` bash
node -v
npm -v
```

## 10. Proyecto en la VM

Ubicación utilizada:

``` text
/opt/city-api/city-api-prototype
```

``` bash
cd /opt/city-api/city-api-prototype
ls
npm ci --omit=dev
```

## 11. Prueba manual de la API

``` bash
infisical run \
  --token="$MY_TOKEN" \
  --projectId="$INFISICAL_PROJECT_ID" \
  --env=dev \
  -- npm start
```

Salida correcta:

``` text
Injecting 8 Infisical secrets into your application process
> node src/server.js
city-api listening on port 3000
```

Prueba:

``` bash
curl http://localhost:3000/health
```

## 12. systemd

Ejecutar Node directamente desde SSH liga el proceso a la terminal.
`systemd` permite cerrar SSH y mantener la API viva, reiniciarla si
falla y arrancarla con la VM.

Archivo de credenciales de infraestructura:

``` text
/etc/city-api.env
```

Contenido:

``` text
INFISICAL_CLIENT_ID=...
INFISICAL_CLIENT_SECRET=...
INFISICAL_PROJECT_ID=...
```

No es necesario almacenar permanentemente `INFISICAL_TOKEN`: se genera
al arrancar.

Protección:

``` bash
sudo chown root:root /etc/city-api.env
sudo chmod 600 /etc/city-api.env
```

Comprobar nombres sin mostrar valores:

``` bash
sudo cat /etc/city-api.env | sed 's/=.*/=***HIDDEN***/'
```

## 13. city-api.service

Archivo:

``` text
/etc/systemd/system/city-api.service
```

Configuración final utilizada:

``` ini
[Unit]
Description=City API
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/city-api/city-api-prototype
EnvironmentFile=/etc/city-api.env
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

ExecStart=/bin/bash -c 'TOKEN=$(infisical login --method=universal-auth --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" --silent --plain) && exec infisical run --token="$TOKEN" --projectId="$INFISICAL_PROJECT_ID" --env=dev -- npm start'

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

IMPORTANTE: `ExecStart=...` no es un comando Bash. Solo pertenece al
archivo `.service`.

Después de modificar el servicio:

``` bash
sudo systemctl daemon-reload
sudo systemctl enable city-api
sudo systemctl restart city-api
```

## 14. Comandos systemd importantes

Estado:

``` bash
sudo systemctl status city-api --no-pager
```

Iniciar:

``` bash
sudo systemctl start city-api
```

Detener:

``` bash
sudo systemctl stop city-api
```

Reiniciar:

``` bash
sudo systemctl restart city-api
```

Logs recientes:

``` bash
journalctl -u city-api -n 30 --no-pager
```

Logs en vivo:

``` bash
journalctl -u city-api -f
```

Salir de `journalctl -f` con `Ctrl+C`.

El mensaje `SIGTERM received. Shutting down...` durante
`systemctl restart` es normal: systemd detiene el proceso anterior y
crea uno nuevo.

## 15. Acceso externo

Express debe aceptar conexiones externas. Puede dejarse explícito:

``` javascript
app.listen(PORT, "0.0.0.0", () => {
  console.log(`city-api listening on port ${PORT}`);
});
```

Comprobar:

``` bash
ss -ltnp | grep 3000
```

Queremos ver `0.0.0.0:3000` o equivalente.

## 16. Firewall de Google Cloud

Obtener IP externa desde Windows:

``` powershell
gcloud compute instances list
```

Para el laboratorio abrimos TCP 3000:

``` powershell
gcloud compute firewall-rules create allow-city-api-3000 `
  --allow=tcp:3000 `
  --direction=INGRESS `
  --source-ranges=0.0.0.0/0 `
  --description="Allow City API port 3000"
```

`0.0.0.0/0` permite conexiones desde cualquier IP. Para una prueba más
segura, usar solo la IP pública del cliente con `/32`.

La regla NO desaparece al cerrar SSH. Para eliminarla:

``` powershell
gcloud compute firewall-rules delete allow-city-api-3000
```

## 17. Pruebas externas

``` text
GET http://IP_PUBLICA_VM:3000/health
GET http://IP_PUBLICA_VM:3000/api/cities
```

Ejemplo POST:

``` http
POST http://IP_PUBLICA_VM:3000/api/cities
Content-Type: application/json
```

``` json
{
  "name": "Arequipa",
  "country": "Peru"
}
```

## 18. Errores encontrados

### Missing required environment variable

Se ejecutó Node sin Infisical. Usar `infisical run ... -- npm ...`.

### Could not find the country column

La estructura real de `city` no coincidía con el código.

### Row-level security policy

Se estaba utilizando la Publishable Key en lugar de la Secret Key del
backend.

### Project ID is required when using machine identity

Agregar `--projectId="$INFISICAL_PROJECT_ID"`.

### Invalid credentials

Revisar Client ID y Client Secret de Universal Auth.

### Access token malformed

No usar un token copiado/estático como solución permanente. Generarlo
con Universal Auth durante el arranque.

### nfisical: command not found

Typo: `nfisical` ❌ / `infisical` ✅.

### ExecStart / command not found

`ExecStart=` pertenece a systemd, no a la consola Bash.

## 19. Operación diaria: solo recordar estos comandos

``` bash
sudo systemctl status city-api --no-pager
```

``` bash
sudo systemctl restart city-api
```

``` bash
journalctl -u city-api -n 30 --no-pager
```

``` bash
curl http://localhost:3000/health
```

No es necesario hacer `infisical login` manualmente cuando el servicio
está configurado con Universal Auth.

## 20. No subir a Git

Nunca versionar:

``` text
SUPABASE_SECRET_KEY
INFISICAL_CLIENT_SECRET
INFISICAL_TOKEN
.env con secretos
credenciales de GCP
```

Sí versionar:

``` text
.env.example
deploy/city-api.service (sin secretos)
schema.sql
README.md
technical.md
src/
```

## 21. Mejoras futuras

Para una versión más cercana a producción:

``` text
Internet
   ↓
HTTPS :443
   ↓
Reverse Proxy
   ↓
Express :3000 interno
```

Pendientes recomendados:

-   cerrar exposición pública directa del puerto 3000;
-   HTTPS;
-   autenticación/autorización del CRUD;
-   separar entorno `prod` de `dev`;
-   mínimo privilegio para Machine Identity;
-   revisar el aviso del CLI sobre la migración del repositorio Linux de
    Infisical;
-   evaluar autenticación nativa GCP ↔ Infisical para reducir secretos
    estáticos;
-   vigilar memoria por tratarse de una VM pequeña.

## 22. Mapa mental

``` text
Node + Express       → aplicación
Infisical            → secretos
Machine Identity     → identidad de la VM
Universal Auth       → obtiene token temporal
Supabase             → datos
systemd              → mantiene vivo Node
GCE                   → servidor
GCP Firewall         → acceso externo
Bruno/Postman        → cliente de prueba
```

**Regla para recordar:** Infisical protege la configuración; systemd
mantiene vivo el proceso; Google Cloud Firewall controla el acceso a la
VM; Supabase almacena los datos.
