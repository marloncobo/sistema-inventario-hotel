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

## 2. Construir, publicar y desplegar por microservicio

Desde la raiz del proyecto:

```powershell
gcloud builds submit `
  --config cloud-run/cloudbuild.inventory.yaml `
  --substitutions=_REGION=$REGION,_REPOSITORY=$REPOSITORY,_TAG=$TAG
```

```powershell
gcloud builds submit `
  --config cloud-run/cloudbuild.rooms.yaml `
  --substitutions=_REGION=$REGION,_REPOSITORY=$REPOSITORY,_TAG=$TAG
```

```powershell
gcloud builds submit `
  --config cloud-run/cloudbuild.gateway.yaml `
  --substitutions=_REGION=$REGION,_REPOSITORY=$REPOSITORY,_TAG=$TAG
```

Cada archivo `cloudbuild` hace tres cosas para un servicio:

- construye la imagen
- la publica en Artifact Registry
- despliega o actualiza el servicio en Cloud Run usando su archivo `env`

## 3. Crear archivos de variables

Copia los ejemplos y completa los valores reales:

```powershell
Copy-Item cloud-run/env.inventory.example.yaml cloud-run/env.inventory.yaml
Copy-Item cloud-run/env.rooms.example.yaml cloud-run/env.rooms.yaml
Copy-Item cloud-run/env.gateway.example.yaml cloud-run/env.gateway.yaml
```

Usa el mismo `JWT_SECRET` en los tres servicios.

Para `SPRING_DATASOURCE_URL`, usa la direccion de tu PostgreSQL disponible para Cloud Run. Si usas Cloud SQL con IP privada, configura Serverless VPC Access y usa la IP privada de la instancia.

## 4. Orden recomendado de despliegue

Ejecuta primero `inventory-service` y `rooms-service`. Cuando Cloud Run te entregue sus URLs finales, actualiza:

- `cloud-run/env.inventory.yaml` con `ROOMS_SERVICE_URL`
- `cloud-run/env.rooms.yaml` con `INVENTORY_SERVICE_URL`
- `cloud-run/env.gateway.yaml` con `INVENTORY_SERVICE_URL` y `ROOMS_SERVICE_URL`

Luego vuelve a lanzar el pipeline del gateway:

```powershell
gcloud builds submit `
  --config cloud-run/cloudbuild.gateway.yaml `
  --substitutions=_REGION=$REGION,_REPOSITORY=$REPOSITORY,_TAG=$TAG
```

## 5. Verificar

Prueba los health checks:

```powershell
curl https://inventory-service-xxxxx-uc.a.run.app/actuator/health
curl https://rooms-service-xxxxx-uc.a.run.app/actuator/health
curl https://gateway-service-xxxxx-uc.a.run.app/actuator/health
```

Usa la URL del gateway como `baseUrl` en Postman.

## 6. Crear triggers de Cloud Build

Puedes crear los tres triggers para GitHub con el script:

```powershell
.\cloud-run\create-triggers.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -Repository $REPOSITORY `
  -BranchPattern "^frontendv3$"
```

Si ya conectaste el repositorio en Cloud Build como 2da generacion, usa mejor el recurso del repositorio:

```powershell
.\cloud-run\create-triggers.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -Repository $REPOSITORY `
  -BranchPattern "^frontendv3$" `
  -RepositoryResource "projects/$PROJECT_ID/locations/$REGION/connections/github-conn/repositories/sistema-inventario-hotel"
```

Si tus builds con trigger deben usar una cuenta de servicio especifica:

```powershell
.\cloud-run\create-triggers.ps1 `
  -ProjectId $PROJECT_ID `
  -Region $REGION `
  -Repository $REPOSITORY `
  -BranchPattern "^frontendv3$" `
  -ServiceAccount "projects/$PROJECT_ID/serviceAccounts/cloud-build-deployer@$PROJECT_ID.iam.gserviceaccount.com"
```

El script crea estos triggers:

- `deploy-inventory-service`
- `deploy-rooms-service`
- `deploy-gateway-service`

Cada trigger escucha cambios solo en los archivos relevantes de su microservicio.

Importante:

- Los triggers de Cloud Build leen archivos desde GitHub, no desde tu maquina local.
- Si usas `cloud-run/env.inventory.yaml`, `cloud-run/env.rooms.yaml` y `cloud-run/env.gateway.yaml`, esos archivos deben existir en el repositorio remoto para que el deploy automatico funcione.
- Si no quieres versionar variables sensibles, conviene migrar a Secret Manager y ajustar los `cloudbuild` para usar `--update-secrets` y `--update-env-vars`.
- Si ves `INVALID_ARGUMENT` al crear el trigger, normalmente el proyecto todavia no tiene el repositorio conectado a Cloud Build o debes usar `-RepositoryResource` en lugar de `-RepoOwner` y `-RepoName`.
