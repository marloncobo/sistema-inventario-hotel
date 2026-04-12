package com.lunara.inventory.repository;

import com.lunara.inventory.model.InternalRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InternalRequestRepository extends JpaRepository<InternalRequest, Long> {
}
