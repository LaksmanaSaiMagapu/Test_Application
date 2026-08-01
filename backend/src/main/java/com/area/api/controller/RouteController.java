package com.area.api.controller;

import com.area.api.model.Route;
import com.area.api.repository.RouteRepository;
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
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {

  private final RouteRepository routeRepository;

  public RouteController(RouteRepository routeRepository) {
    this.routeRepository = routeRepository;
  }

  @GetMapping
  public List<Route> getAllRoutes() {
    return routeRepository.findAll();
  }

  @PostMapping
  public Route createRoute(@RequestBody Route route) {
    return routeRepository.save(route);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteRoute(@PathVariable Long id) {
    if (!routeRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    routeRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
