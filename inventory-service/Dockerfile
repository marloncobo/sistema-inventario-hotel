FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY inventory-service/pom.xml inventory-service/pom.xml
COPY rooms-service/pom.xml rooms-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml
COPY inventory-service/src inventory-service/src
RUN mvn -pl inventory-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring spring
COPY --from=build /workspace/inventory-service/target/*.jar app.jar
EXPOSE 8081
USER spring:spring
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl --fail --silent http://localhost:8081/actuator/health >/dev/null || exit 1
ENTRYPOINT ["sh","-c","java ${JAVA_OPTS:-} -jar /app/app.jar"]
