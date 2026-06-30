"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ThreeSeatMap({ seats = [], selectedSeat = null, onSeatClick = () => {} }) {
  const mountRef = useRef(null);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const seatsRef = useRef(seats);

  // Keep ref up to date so animation loop always has latest backend data
  useEffect(() => {
    seatsRef.current = seats;
  }, [seats]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // Scene (Gallery Light Background matching globals.css bg)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf9f6);
    scene.fog = new THREE.FogExp2(0xfaf9f6, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    
    // Spherical coordinates for custom camera controls
    let radius = 18;
    let theta = Math.PI / 4; // horizontal rotation
    let phi = Math.PI / 3;   // vertical angle

    const updateCameraPosition = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 1, 0);
    };
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights (Bright Gallery Feel)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Spotlight for warm saffron highlight
    const spotLight = new THREE.SpotLight(0xffaa44, 1.2, 25, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 12, 0);
    scene.add(spotLight);

    // Light Gray Floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0xf3f4f6, 
      roughness: 0.7,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Subtle saffron grid boundaries with light subdivisions
    const gridHelper = new THREE.GridHelper(24, 24, 0xff8c00, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Helper: text texture generator for desk labels
    const createTextTexture = (text) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      
      // Draw background (White card placard)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 128, 64);
      
      // Draw border
      ctx.strokeStyle = "#ff6b00";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 124, 60);

      // Draw text
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#15161c";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 64, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // Desk Map objects array
    const deskGroupList = [];
    const deskMap = new Map(); // Mesh UUID -> Seat Info

    const buildFloorPlan = () => {
      // Clear existing mesh items
      deskGroupList.forEach(grp => scene.remove(grp));
      deskGroupList.length = 0;
      deskMap.clear();

      const currentSeats = seatsRef.current;
      
      // Fallback/Mock seats if database seats are not loaded yet
      const itemsToRender = currentSeats.length > 0 ? currentSeats : [
        { id: "1", seat_number: "A1", status: "available" },
        { id: "2", seat_number: "A2", status: "available" },
        { id: "3", seat_number: "A3", status: "booked" },
        { id: "4", seat_number: "A4", status: "reserved" },
        { id: "5", seat_number: "B1", status: "available" },
        { id: "6", seat_number: "B2", status: "booked" },
        { id: "7", seat_number: "B3", status: "available" },
        { id: "8", seat_number: "B4", status: "available" },
        { id: "9", seat_number: "C1", status: "available" },
        { id: "10", seat_number: "C2", status: "available" },
        { id: "11", seat_number: "C3", status: "reserved" },
        { id: "12", seat_number: "C4", status: "available" }
      ];

      const cols = 4;
      const spacingX = 4;
      const spacingZ = 4;

      itemsToRender.forEach((seat, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = (col - (cols - 1) / 2) * spacingX;
        const z = (row - (Math.ceil(itemsToRender.length / cols) - 1) / 2) * spacingZ;

        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Colors based on availability
        let deskColor = 0x10b981; // Green
        let statusStr = seat.status || "available";

        if (seat.assigned_student_id) {
          statusStr = "booked";
          deskColor = 0xef4444; // Red
        } else if (seat.reservation_pending) {
          statusStr = "reserved";
          deskColor = 0xf59e0b; // Yellow
        } else if (seat.is_active === false) {
          statusStr = "inactive";
          deskColor = 0x9ca3af; // Gray
        }

        // Override color if selected
        const isSelected = selectedSeat && selectedSeat.id === seat.id;
        if (isSelected) {
          deskColor = 0xff6b00; // Saffron Orange
        }

        // 3D Desk Geometry
        const deskGeo = new THREE.BoxGeometry(2, 0.8, 1.2);
        const deskMat = new THREE.MeshStandardMaterial({ 
          color: deskColor, 
          roughness: 0.3,
          metalness: 0.1,
          emissive: isSelected ? 0xff6b00 : 0x000000,
          emissiveIntensity: 0.2
        });
        const deskMesh = new THREE.Mesh(deskGeo, deskMat);
        deskMesh.position.y = 0.4;
        deskMesh.castShadow = true;
        deskMesh.receiveShadow = true;
        group.add(deskMesh);

        deskMap.set(deskMesh.uuid, { seat, mesh: deskMesh, originalColor: deskColor, status: statusStr });

        // 3D Chair
        const chairGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.8 }); // Light gray chair
        const chairMesh = new THREE.Mesh(chairGeo, chairMat);
        chairMesh.position.set(0, 0.3, 0.9);
        chairMesh.castShadow = true;
        group.add(chairMesh);

        // Plaque placard name tag
        const tagGeo = new THREE.BoxGeometry(0.6, 0.3, 0.05);
        const tagTex = createTextTexture(seat.seat_number);
        const tagMat = new THREE.MeshBasicMaterial({ map: tagTex });
        const tagMesh = new THREE.Mesh(tagGeo, tagMat);
        tagMesh.position.set(0, 0.95, -0.25);
        tagMesh.rotation.x = -Math.PI / 12;
        group.add(tagMesh);

        scene.add(group);
        deskGroupList.push(group);
      });
    };

    buildFloorPlan();

    const rebuildInterval = setInterval(() => {
      buildFloorPlan();
    }, 3000);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentIntersected = null;

    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        
        theta -= deltaX * 0.007;
        phi -= deltaY * 0.007;
        phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi));

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        updateCameraPosition();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      radius += e.deltaY * 0.01;
      radius = Math.max(8, Math.min(30, radius));
      updateCameraPosition();
    };

    const onClick = () => {
      if (currentIntersected) {
        const clickedData = deskMap.get(currentIntersected.uuid);
        if (clickedData && clickedData.status !== "inactive") {
          onSeatClick(clickedData.seat);
        }
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("click", onClick);

    let reqId = null;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      const meshesToIntersect = Array.from(deskMap.values()).map(d => d.mesh);
      const intersects = raycaster.intersectObjects(meshesToIntersect);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        if (currentIntersected !== hitMesh) {
          if (currentIntersected) {
            const data = deskMap.get(currentIntersected.uuid);
            if (data) {
              data.mesh.material.emissive.setHex(0x000000);
            }
          }
          currentIntersected = hitMesh;
          
          const data = deskMap.get(hitMesh.uuid);
          if (data) {
            data.mesh.material.emissive.setHex(0xff6b00); // Saffron hover glow
            data.mesh.material.emissiveIntensity = 0.3;
            setHoveredSeat(data.seat);
          }
        }
      } else {
        if (currentIntersected) {
          const data = deskMap.get(currentIntersected.uuid);
          if (data) {
            const isSelected = selectedSeat && selectedSeat.id === data.seat.id;
            data.mesh.material.emissive.setHex(isSelected ? 0xff6b00 : 0x000000);
            data.mesh.material.emissiveIntensity = isSelected ? 0.2 : 0.0;
          }
          currentIntersected = null;
          setHoveredSeat(null);
        }
      }

      spotLight.position.x = 2 * Math.sin(Date.now() * 0.001);
      spotLight.position.z = 2 * Math.cos(Date.now() * 0.001);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(rebuildInterval);
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      if (container) {
        container.removeEventListener("mousedown", onMouseDown);
        container.removeEventListener("mousemove", onMouseMove);
        container.removeEventListener("mouseup", onMouseUp);
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("click", onClick);
      }
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [seats, selectedSeat]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      
      {hoveredSeat && (
        <div style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.5rem",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(0,0,0,0.06)",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
        }}>
          <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)" }}>Seat {hoveredSeat.seat_number}</h4>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-success)", textTransform: "capitalize", fontWeight: "600" }}>
            {hoveredSeat.assigned_student_id ? "Booked" : hoveredSeat.reservation_pending ? "Reserved" : "Available"}
          </p>
        </div>
      )}

      <div className="controls-hint">
        🖱️ Drag to rotate | 📜 Scroll to zoom | 👆 Click to select
      </div>
    </div>
  );
}
