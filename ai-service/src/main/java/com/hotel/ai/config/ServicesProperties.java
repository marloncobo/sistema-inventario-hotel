package com.hotel.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "services")
public class ServicesProperties {
    private final Inventory inventory = new Inventory();
    private final Rooms rooms = new Rooms();
    private final Gateway gateway = new Gateway();

    public Inventory getInventory() {
        return inventory;
    }

    public Rooms getRooms() {
        return rooms;
    }

    public Gateway getGateway() {
        return gateway;
    }

    public static class Inventory {
        private String baseUrl = "http://localhost:8081";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    public static class Rooms {
        private String baseUrl = "http://localhost:8082";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    public static class Gateway {
        private String baseUrl = "http://localhost:8080";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }
}
