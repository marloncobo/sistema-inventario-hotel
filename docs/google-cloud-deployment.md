# Despliegue en Google Cloud

Esta configuracion despliega los tres microservicios en Cloud Run y usa Cloud SQL para PostgreSQL.

## Requisitos

- Un proyecto de Google Cloud con facturacion activa.
- `gcloud` autenticado y configurado con el proyecto.
- APIs habilitadas: Cloud Run, Cloud Build, Artifact Registry, Cloud SQL Admin y Secret Manager.
- Una instancia de Cloud SQL para PostgreSQL.

## Preparar base de datos

Crea las tres bases de datos en la instancia de PostgreSQL:

```sql
CREATE DATABASE lunara_identity;
CREATE DATABASE lunara_masterdata;
CREATE DATABASE lunara_inventory;
```

Los scripts `schema.sql` y `data.sql` se ejecutan al iniciar cada servicio. Para despliegues posteriores puedes cambiar `SPRING_SQL_INIT_MODE=never` en Cloud Run si ya no quieres reinyectar datos semilla.

## Crear secretos

```bash
printf "TU_PASSWORD_POSTGRES" | gcloud secrets create lunara-db-password --data-file=-
printf "TU_SECRETO_JWT_LARGO_Y_SEGURO" | gcloud secrets create lunara-jwt-secret --data-file=-
```

Da acceso a los secretos al service account que ejecuta Cloud Run y al service account de Cloud Build.

## Desplegar con Cloud Build

Reemplaza `_CLOUD_SQL_CONNECTION_NAME` por el connection name real de Cloud SQL, con formato `project:region:instance`.

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=us-central1,_CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:us-central1:lunara-postgres
```

El build crea el repositorio de Artifact Registry si no existe, construye las tres imagenes, las publica y despliega:

- `identity-service`
- `masterdata-service`
- `inventory-service`

## Variables principales en Cloud Run

- `SPRING_PROFILES_ACTIVE=gcp`
- `CLOUD_SQL_CONNECTION_NAME=project:region:instance`
- `DB_NAME=lunara_identity | lunara_masterdata | lunara_inventory`
- `DB_USER=postgres`
- `DB_PASSWORD` desde Secret Manager
- `APP_JWT_SECRET` desde Secret Manager

## Notas

- Cloud Run define `PORT` automaticamente; las aplicaciones ya lo leen.
- El mismo `APP_JWT_SECRET` debe usarse en los tres servicios para validar el mismo token JWT.
- Si quieres servicios privados, cambia `--allow-unauthenticated` en `cloudbuild.yaml` por una politica IAM de invocacion controlada.
