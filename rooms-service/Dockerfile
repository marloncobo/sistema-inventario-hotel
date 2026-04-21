FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY inventory-service/pom.xml inventory-service/pom.xml
COPY rooms-service/pom.xml rooms-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY rooms-service/src rooms-service/src
RUN mvn -pl rooms-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring spring
COPY --from=build /workspace/rooms-service/target/*.jar app.jar
EXPOSE 8080
USER spring:spring
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl --fail --silent http://localhost:${PORT:-8080}/actuator/health >/dev/null || exit 1
ENTRYPOINT ["sh","-c","java ${JAVA_OPTS:-} -jar /app/app.jar"]
