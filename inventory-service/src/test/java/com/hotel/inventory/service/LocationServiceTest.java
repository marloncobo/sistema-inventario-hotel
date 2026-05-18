package com.hotel.inventory.service;

import com.hotel.inventory.dto.CreateLocationRequest;
import com.hotel.inventory.dto.UpdateLocationRequest;
import com.hotel.inventory.model.Location;
import com.hotel.inventory.repository.LocationRepository;
import com.hotel.inventory.repository.StockByLocationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private StockByLocationRepository stockByLocationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private LocationService locationService;

    @Test
    void createGeneratesSequentialCodeIgnoringLegacyCodes() {
        when(locationRepository.findAllCodes()).thenReturn(Arrays.asList("BODEGA_PRINCIPAL", "LOC-0007", "HAB_101", null));
        when(locationRepository.existsByCodeIgnoreCase("LOC-0008")).thenReturn(false);
        when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> {
            Location location = invocation.getArgument(0);
            location.setId(8L);
            return location;
        });

        Location created = locationService.create(
                new CreateLocationRequest(null, "Carro auxiliar", Location.Type.CARRITO, null, null, null, true),
                "admin"
        );

        assertThat(created.getCode()).isEqualTo("LOC-0008");
        verify(auditService).record("CREATE", "Location", 8L, "admin", "LOC-0008");
    }

    @Test
    void updateKeepsManualCodeFlow() {
        Location existing = new Location("LOC-0003", "Carro auxiliar", Location.Type.CARRITO, null, null, null, true);
        existing.setId(3L);
        when(locationRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(locationRepository.existsByCodeIgnoreCaseAndIdNot("CARRO_3", 3L)).thenReturn(false);
        when(locationRepository.save(any(Location.class))).thenAnswer(invocation -> invocation.getArgument(0));

        locationService.update(
                3L,
                new UpdateLocationRequest("carro_3", "Carro auxiliar", Location.Type.CARRITO, null, null, null, true),
                "admin"
        );

        ArgumentCaptor<Location> captor = ArgumentCaptor.forClass(Location.class);
        verify(locationRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).isEqualTo("CARRO_3");
    }
}
