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
@Table(name = "areas")
public class Area {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 4000)
  private String coordinates;

  @Column(nullable = false, length = 4000)
  private String coordinateLabels;

  private Double areaValue;

  private String areaUnit;

  @Column(nullable = false)
  private Instant createdAt;

  public Area() {
  }

  @PrePersist
  public void prePersist() {
    if (this.createdAt == null) {
      this.createdAt = Instant.now();
    }
  }

  public Area(String name, String coordinates, String coordinateLabels, Double areaValue, String areaUnit) {
    this.name = name;
    this.coordinates = coordinates;
    this.coordinateLabels = coordinateLabels;
    this.areaValue = areaValue;
    this.areaUnit = areaUnit;
    this.createdAt = Instant.now();
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

  public String getCoordinates() {
    return coordinates;
  }

  public void setCoordinates(String coordinates) {
    this.coordinates = coordinates;
  }

  public String getCoordinateLabels() {
    return coordinateLabels;
  }

  public void setCoordinateLabels(String coordinateLabels) {
    this.coordinateLabels = coordinateLabels;
  }

  public Double getAreaValue() {
    return areaValue;
  }

  public void setAreaValue(Double areaValue) {
    this.areaValue = areaValue;
  }

  public String getAreaUnit() {
    return areaUnit;
  }

  public void setAreaUnit(String areaUnit) {
    this.areaUnit = areaUnit;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
