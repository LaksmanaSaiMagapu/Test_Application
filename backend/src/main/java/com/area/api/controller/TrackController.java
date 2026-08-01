package com.area.api.controller;

import com.area.api.model.Track;
import com.area.api.repository.TrackRepository;
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
@RequestMapping("/api/tracks")
@CrossOrigin(origins = "*")
public class TrackController {

  private final TrackRepository trackRepository;

  public TrackController(TrackRepository trackRepository) {
    this.trackRepository = trackRepository;
  }

  @GetMapping
  public List<Track> getAllTracks() {
    return trackRepository.findAll();
  }

  @PostMapping
  public Track createTrack(@RequestBody Track track) {
    return trackRepository.save(track);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteTrack(@PathVariable Long id) {
    if (!trackRepository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    trackRepository.deleteById(id);
    return ResponseEntity.noContent().build();
  }
}
