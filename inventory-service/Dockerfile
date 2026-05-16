# syntax=docker/dockerfile:1.7
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

ENV MAVEN_OPTS="-Dhttps.protocols=TLSv1.2,TLSv1.3 -Dmaven.wagon.http.retryHandler.count=5"

COPY docker/maven/settings.xml /root/.m2/settings.xml

COPY pom.xml .
COPY inventory-service/pom.xml inventory-service/pom.xml
COPY rooms-service/pom.xml rooms-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml

RUN --mount=type=cache,target=/root/.m2/repository \
    sh -ec 'for i in 1 2 3 4 5; do echo ">>> dependency:go-offline attempt $i"; mvn -B -pl inventory-service -am dependency:go-offline -DskipTests && exit 0; echo ">>> failed, wait 20s"; sleep 20; done; exit 1'

COPY inventory-service/src inventory-service/src

RUN --mount=type=cache,target=/root/.m2/repository \
    sh -ec 'for i in 1 2 3 4 5; do echo ">>> package attempt $i"; mvn -B -pl inventory-service -am package -DskipTests && exit 0; echo ">>> failed, wait 20s"; sleep 20; done; exit 1'

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring spring
COPY --from=build /workspace/inventory-service/target/*.jar app.jar
EXPOSE 8080
USER spring:spring
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl --fail --silent http://localhost:${PORT:-8080}/actuator/health >/dev/null || exit 1
ENTRYPOINT ["sh","-c","java ${JAVA_OPTS:-} -jar /app/app.jar"]
