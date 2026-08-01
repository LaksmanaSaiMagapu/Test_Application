package com.area.api.controller;

import com.area.api.model.Area;
import com.area.api.repository.AreaRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/areas")
@CrossOrigin(origins = "*")
public class AreaController {

  private final AreaRepository areaRepository;

  public AreaController(AreaRepository areaRepository) {
    this.areaRepository = areaRepository;
  }

  @GetMapping
  public List<Area> getAllAreas() {
    return areaRepository.findAll();
  }

  @PostMapping
  public Area createArea(@RequestBody Area area) {
    return areaRepository.save(area);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteArea(@PathVariable Long id) {
    if (!areaRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    areaRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
