package com.area.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "routes")
public class Route {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Double startLatitude;

  @Column(nullable = false)
  private Double startLongitude;

  @Column(nullable = false)
  private Double endLatitude;

  @Column(nullable = false)
  private Double endLongitude;

  private String validity;

  @Column(nullable = false)
  private Instant createdAt;

  public Route() {
  }

  @PrePersist
  public void prePersist() {
    if (this.createdAt == null) {
      this.createdAt = Instant.now();
    }
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Double getStartLatitude() {
    return startLatitude;
  }

  public void setStartLatitude(Double startLatitude) {
    this.startLatitude = startLatitude;
  }

  public Double getStartLongitude() {
    return startLongitude;
  }

  public void setStartLongitude(Double startLongitude) {
    this.startLongitude = startLongitude;
  }

  public Double getEndLatitude() {
    return endLatitude;
  }

  public void setEndLatitude(Double endLatitude) {
    this.endLatitude = endLatitude;
  }

  public Double getEndLongitude() {
    return endLongitude;
  }

  public void setEndLongitude(Double endLongitude) {
    this.endLongitude = endLongitude;
  }

  public String getValidity() {
    return validity;
  }

  public void setValidity(String validity) {
    this.validity = validity;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
