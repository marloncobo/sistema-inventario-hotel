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
COPY --from=build /workspace/rooms-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]
