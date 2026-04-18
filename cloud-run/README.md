# Despliegue en Cloud Run

Estos servicios ya leen el puerto desde `PORT`, que es la variable que Cloud Run inyecta al contenedor.

## 1. Preparar Google Cloud

Define tus valores:

```powershell
$PROJECT_ID = "tu-proyecto"
$REGION = "us-central1"
$REPOSITORY = "hotel-inventory"
$TAG = "latest"
gcloud config set project $PROJECT_ID
```

Activa las APIs necesarias:

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Crea el repositorio de imagenes si no existe:

```powershell
gcloud artifacts repositories create $REPOSITORY `
  --repository-format=docker `
  --location=$REGION `
  --description="Hotel inventory services"
```

## 2. Construir y publicar imagenes

Desde la raiz del proyecto:

```powershell
gcloud builds submit `
  --config cloudbuild.yaml `
  --substitutions=_REGION=$REGION,_REPOSITORY=$REPOSITORY,_TAG=$TAG
```

Esto publica:

- `inventory-service`
- `rooms-service`
- `gateway-service`

## 3. Crear archivos de variables

Copia los ejemplos y completa los valores reales:

```powershell
Copy-Item cloud-run/env.inventory.example.yaml cloud-run/env.inventory.yaml
Copy-Item cloud-run/env.rooms.example.yaml cloud-run/env.rooms.yaml
Copy-Item cloud-run/env.gateway.example.yaml cloud-run/env.gateway.yaml
```

Usa el mismo `JWT_SECRET` en los tres servicios.

Para `SPRING_DATASOURCE_URL`, usa la direccion de tu PostgreSQL disponible para Cloud Run. Si usas Cloud SQL con IP privada, configura Serverless VPC Access y usa la IP privada de la instancia.

## 4. Desplegar servicios

Despliega primero `inventory-service` y `rooms-service`, luego actualiza sus URLs cruzadas en los archivos YAML cuando Cloud Run muestre las URLs finales.

```powershell
gcloud run deploy inventory-service `
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/inventory-service:$TAG" `
  --region $REGION `
  --platform managed `
  --port 8080 `
  --allow-unauthenticated `
  --env-vars-file cloud-run/env.inventory.yaml
```

```powershell
gcloud run deploy rooms-service `
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/rooms-service:$TAG" `
  --region $REGION `
  --platform managed `
  --port 8080 `
  --allow-unauthenticated `
  --env-vars-file cloud-run/env.rooms.yaml
```

Luego despliega el gateway con las URLs reales de inventory y rooms:

```powershell
gcloud run deploy gateway-service `
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/gateway-service:$TAG" `
  --region $REGION `
  --platform managed `
  --port 8080 `
  --allow-unauthenticated `
  --env-vars-file cloud-run/env.gateway.yaml
```

## 5. Verificar

Prueba los health checks:

```powershell
curl https://inventory-service-xxxxx-uc.a.run.app/actuator/health
curl https://rooms-service-xxxxx-uc.a.run.app/actuator/health
curl https://gateway-service-xxxxx-uc.a.run.app/actuator/health
```

Usa la URL del gateway como `baseUrl` en Postman.
