package com.hotel.inventory.service;

import com.hotel.inventory.dto.CatalogRequest;
import com.hotel.inventory.exception.BusinessException;
import com.hotel.inventory.model.Area;
import com.hotel.inventory.model.Category;
import com.hotel.inventory.model.Provider;
import com.hotel.inventory.model.UnitOfMeasure;
import com.hotel.inventory.repository.AreaRepository;
import com.hotel.inventory.repository.CategoryRepository;
import com.hotel.inventory.repository.ProviderRepository;
import com.hotel.inventory.repository.UnitOfMeasureRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {
    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UnitOfMeasureRepository unitRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CatalogService catalogService;

    @Test
    void createCategoryGeneratesNextCode() {
        when(categoryRepository.findAllCodes()).thenReturn(Arrays.asList("CAT-0007", "LEGACY", null));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(11L);
            return category;
        });

        Category created = catalogService.createCategory(request(null, "Lenceria", null, null), "admin");

        assertThat(created.getCode()).isEqualTo("CAT-0008");
        assertThat(created.getName()).isEqualTo("LENCERIA");
    }

    @Test
    void createUnitGeneratesNextCode() {
        when(unitRepository.findAllCodes()).thenReturn(List.of("UNI-0010"));
        when(unitRepository.save(any(UnitOfMeasure.class))).thenAnswer(invocation -> {
            UnitOfMeasure unit = invocation.getArgument(0);
            unit.setId(5L);
            return unit;
        });

        UnitOfMeasure created = catalogService.createUnit(request(null, "Unidad", "und", null), "admin");

        assertThat(created.getCode()).isEqualTo("UNI-0011");
        assertThat(created.getAbbreviation()).isEqualTo("UND");
    }

    @Test
    void createProviderGeneratesNextCode() {
        when(providerRepository.findAllCodes()).thenReturn(List.of("PRO-0003", "PRO-0009"));
        when(providerRepository.save(any(Provider.class))).thenAnswer(invocation -> {
            Provider provider = invocation.getArgument(0);
            provider.setId(8L);
            return provider;
        });

        Provider created = catalogService.createProvider(
                request(null, "Proveedor Uno", null, "900123456"),
                "admin"
        );

        assertThat(created.getCode()).isEqualTo("PRO-0010");
        assertThat(created.getDocumentNumber()).isEqualTo("900123456");
    }

    @Test
    void createAreaGeneratesNextCode() {
        when(areaRepository.findAllCodes()).thenReturn(List.of("ARE-0002"));
        when(areaRepository.save(any(Area.class))).thenAnswer(invocation -> {
            Area area = invocation.getArgument(0);
            area.setId(13L);
            return area;
        });

        Area created = catalogService.createArea(request(null, "Lavanderia", null, null), "admin");

        assertThat(created.getCode()).isEqualTo("ARE-0003");
        assertThat(created.getName()).isEqualTo("LAVANDERIA");
    }

    @Test
    void updateCategoryRequiresCode() {
        Category existing = new Category("CAT-0001", "MINIBAR", true);
        existing.setId(1L);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> catalogService.updateCategory(1L, request(null, "Minibar", null, null), "admin"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("codigo");
    }

    @Test
    void updateProviderPersistsExplicitCode() {
        Provider existing = new Provider("PRO-0001", "900001001", "Proveedor Uno", null, null, true);
        existing.setId(4L);
        when(providerRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(providerRepository.save(existing)).thenReturn(existing);

        Provider updated = catalogService.updateProvider(
                4L,
                new CatalogRequest("pro-0099", "Proveedor Uno", null, "900001001", "3001234567", "proveedor@hotel.com", true),
                "admin"
        );

        assertThat(updated.getCode()).isEqualTo("PRO-0099");
        assertThat(updated.getPhone()).isEqualTo("3001234567");

        ArgumentCaptor<Provider> providerCaptor = ArgumentCaptor.forClass(Provider.class);
        verify(providerRepository).save(providerCaptor.capture());
        assertThat(providerCaptor.getValue().getCode()).isEqualTo("PRO-0099");
    }

    private static CatalogRequest request(String code, String name, String abbreviation, String documentNumber) {
        return new CatalogRequest(code, name, abbreviation, documentNumber, null, null, true);
    }
}
