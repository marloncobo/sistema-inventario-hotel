package com.hotel.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "services")
public class ServicesProperties {
    private final Inventory inventory = new Inventory();

    public Inventory getInventory() {
        return inventory;
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
}
