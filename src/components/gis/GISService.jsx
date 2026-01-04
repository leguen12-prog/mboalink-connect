import { base44 } from '@/api/base44Client';

/**
 * GIS Service - Core geospatial operations and integrations
 */

export class GISService {
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if point is within polygon
   */
  static pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * Validate serviceability for an address
   */
  static async checkServiceability(lat, lng) {
    try {
      const zones = await base44.entities.ServiceabilityZone.list();
      
      for (const zone of zones) {
        if (zone.geometry && zone.geometry.type === 'Polygon') {
          const coords = zone.geometry.coordinates[0];
          if (this.pointInPolygon([lng, lat], coords)) {
            return {
              serviceable: zone.serviceability_status === 'fully_serviceable',
              zone: zone,
              technology: zone.technology,
              max_speed: zone.max_speed_mbps,
              serving_olt: zone.serving_olt_id
            };
          }
        }
      }
      
      return {
        serviceable: false,
        message: 'Address is outside service coverage'
      };
    } catch (error) {
      console.error('Serviceability check failed:', error);
      throw error;
    }
  }

  /**
   * Find optimal fibre path using A* algorithm (simplified)
   */
  static async findOptimalPath(fromAssetId, toAssetId) {
    try {
      const assets = await base44.entities.GISAsset.list();
      const routes = await base44.entities.FibreRoute.list();
      
      // Build asset map
      const assetMap = {};
      assets.forEach(a => assetMap[a.asset_id] = a);
      
      const startAsset = assetMap[fromAssetId];
      const endAsset = assetMap[toAssetId];
      
      if (!startAsset || !endAsset) {
        throw new Error('Start or end asset not found');
      }
      
      // Simple pathfinding using existing routes
      const path = [];
      const visited = new Set();
      
      const findPath = (currentId, targetId, currentPath = []) => {
        if (currentId === targetId) {
          return [...currentPath, targetId];
        }
        
        if (visited.has(currentId)) return null;
        visited.add(currentId);
        
        // Find connected routes
        const connectedRoutes = routes.filter(r => 
          r.from_asset_id === currentId && r.status === 'active'
        );
        
        for (const route of connectedRoutes) {
          const result = findPath(route.to_asset_id, targetId, [...currentPath, currentId]);
          if (result) return result;
        }
        
        return null;
      };
      
      const assetPath = findPath(fromAssetId, toAssetId);
      
      if (!assetPath) {
        return {
          found: false,
          message: 'No available path found'
        };
      }
      
      // Calculate total distance
      let totalDistance = 0;
      for (let i = 0; i < assetPath.length - 1; i++) {
        const asset1 = assetMap[assetPath[i]];
        const asset2 = assetMap[assetPath[i + 1]];
        
        if (asset1.geometry && asset2.geometry) {
          const [lon1, lat1] = asset1.geometry.coordinates;
          const [lon2, lat2] = asset2.geometry.coordinates;
          totalDistance += this.calculateDistance(lat1, lon1, lat2, lon2);
        }
      }
      
      return {
        found: true,
        path: assetPath,
        assets: assetPath.map(id => assetMap[id]),
        distance: totalDistance,
        hops: assetPath.length - 1
      };
    } catch (error) {
      console.error('Path finding failed:', error);
      throw error;
    }
  }

  /**
   * Get assets within radius
   */
  static async getAssetsInRadius(lat, lng, radiusMeters, assetTypes = []) {
    try {
      const assets = await base44.entities.GISAsset.list();
      
      return assets.filter(asset => {
        if (assetTypes.length > 0 && !assetTypes.includes(asset.asset_type)) {
          return false;
        }
        
        if (!asset.geometry || asset.geometry.type !== 'Point') {
          return false;
        }
        
        const [lon, assetLat] = asset.geometry.coordinates;
        const distance = this.calculateDistance(lat, lng, assetLat, lon);
        
        return distance <= radiusMeters;
      });
    } catch (error) {
      console.error('Radius search failed:', error);
      throw error;
    }
  }

  /**
   * Predict affected customers for an outage
   */
  static async predictAffectedCustomers(assetId) {
    try {
      const asset = await base44.entities.GISAsset.filter({ asset_id: assetId });
      if (!asset || asset.length === 0) {
        throw new Error('Asset not found');
      }
      
      const affectedAsset = asset[0];
      const customers = await base44.entities.Customer.list();
      const onts = await base44.entities.ONT.list();
      
      // Find all ONTs connected downstream
      const affectedONTs = [];
      
      if (affectedAsset.asset_type === 'olt') {
        // All ONTs connected to this OLT
        affectedONTs.push(...onts.filter(ont => ont.olt_id === assetId));
      } else if (affectedAsset.asset_type === 'fibre_route') {
        // Find ONTs served by this route (simplified)
        const downstreamAssets = affectedAsset.connected_assets || [];
        affectedONTs.push(...onts.filter(ont => downstreamAssets.includes(ont.ont_id)));
      }
      
      // Map ONTs to customers
      const affectedCustomers = customers.filter(c => 
        affectedONTs.some(ont => ont.customer_id === c.id)
      );
      
      return {
        affected_count: affectedCustomers.length,
        customers: affectedCustomers,
        onts: affectedONTs,
        impact_radius_meters: this.calculateImpactRadius(affectedAsset)
      };
    } catch (error) {
      console.error('Affected customer prediction failed:', error);
      throw error;
    }
  }

  /**
   * Calculate impact radius based on asset type
   */
  static calculateImpactRadius(asset) {
    const radiusMap = {
      'olt': 5000,
      'splitter': 1000,
      'fibre_route': 2000,
      'pole': 500,
      'manhole': 300
    };
    return radiusMap[asset.asset_type] || 1000;
  }

  /**
   * Auto-assign splitter and OLT for provisioning
   */
  static async autoAssignNetwork(customerLat, customerLng) {
    try {
      // Find nearest available OLT
      const olts = await this.getAssetsInRadius(customerLat, customerLng, 10000, ['olt']);
      const activeOLTs = olts.filter(olt => 
        olt.status === 'active' && 
        olt.capacity && 
        olt.capacity.available > 0
      );
      
      if (activeOLTs.length === 0) {
        return {
          success: false,
          message: 'No available OLT in range'
        };
      }
      
      // Sort by distance and capacity
      activeOLTs.sort((a, b) => {
        const [lonA, latA] = a.geometry.coordinates;
        const [lonB, latB] = b.geometry.coordinates;
        const distA = this.calculateDistance(customerLat, customerLng, latA, lonA);
        const distB = this.calculateDistance(customerLat, customerLng, latB, lonB);
        return distA - distB;
      });
      
      const selectedOLT = activeOLTs[0];
      
      // Find nearest splitter
      const splitters = await this.getAssetsInRadius(customerLat, customerLng, 2000, ['splitter']);
      const availableSplitters = splitters.filter(s => 
        s.status === 'active' &&
        s.properties?.serving_olt === selectedOLT.asset_id &&
        s.capacity?.available > 0
      );
      
      const selectedSplitter = availableSplitters.length > 0 ? availableSplitters[0] : null;
      
      return {
        success: true,
        olt: selectedOLT,
        splitter: selectedSplitter,
        estimated_drop_length: selectedSplitter 
          ? this.calculateDistance(
              customerLat, 
              customerLng,
              selectedSplitter.geometry.coordinates[1],
              selectedSplitter.geometry.coordinates[0]
            )
          : null
      };
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cluster-based expansion zones
   */
  static async calculateExpansionZones(minCustomers = 50, maxDistance = 1000) {
    try {
      const customers = await base44.entities.Customer.list();
      const zones = await base44.entities.ServiceabilityZone.list();
      
      // Get unserved customers
      const unservedCustomers = customers.filter(c => 
        c.status === 'pending_activation' && 
        c.address?.gps_coordinates
      );
      
      // Simple clustering algorithm
      const clusters = [];
      const processed = new Set();
      
      unservedCustomers.forEach(customer => {
        if (processed.has(customer.id)) return;
        
        const { lat, lng } = customer.address.gps_coordinates;
        const nearbyCustomers = unservedCustomers.filter(c => {
          if (processed.has(c.id)) return false;
          const { lat: cLat, lng: cLng } = c.address.gps_coordinates;
          const dist = this.calculateDistance(lat, lng, cLat, cLng);
          return dist <= maxDistance;
        });
        
        if (nearbyCustomers.length >= minCustomers) {
          clusters.push({
            center: { lat, lng },
            customers: nearbyCustomers,
            count: nearbyCustomers.length,
            priority: this.calculateExpansionPriority(nearbyCustomers)
          });
          
          nearbyCustomers.forEach(c => processed.add(c.id));
        }
      });
      
      return clusters.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Expansion zone calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate expansion priority score
   */
  static calculateExpansionPriority(customers) {
    // Simple scoring: more customers + higher potential ARPU
    const baseScore = customers.length * 10;
    const businessCustomers = customers.filter(c => c.customer_type === 'business').length;
    const businessBonus = businessCustomers * 5;
    return baseScore + businessBonus;
  }

  /**
   * Sync inventory with GIS
   */
  static async syncInventoryToGIS() {
    try {
      const olts = await base44.entities.OLT.list();
      const onts = await base44.entities.ONT.list();
      
      const updates = [];
      
      // Sync OLTs
      for (const olt of olts) {
        if (olt.location?.gps_lat && olt.location?.gps_lng) {
          updates.push(
            base44.entities.GISAsset.create({
              asset_id: `OLT-${olt.olt_id}`,
              layer_id: 'infrastructure',
              asset_type: 'olt',
              name: olt.name,
              geometry: {
                type: 'Point',
                coordinates: [olt.location.gps_lng, olt.location.gps_lat]
              },
              properties: {
                vendor: olt.vendor,
                model: olt.model,
                total_pon_ports: olt.total_pon_ports,
                active_onts: olt.active_onts
              },
              status: olt.status,
              capacity: {
                total: olt.total_ont_capacity,
                used: olt.active_onts,
                available: olt.total_ont_capacity - olt.active_onts
              },
              inventory_ref: olt.id
            })
          );
        }
      }
      
      return {
        synced: updates.length,
        message: `Synced ${updates.length} assets to GIS`
      };
    } catch (error) {
      console.error('Inventory sync failed:', error);
      throw error;
    }
  }
}