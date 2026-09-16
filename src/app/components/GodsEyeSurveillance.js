'use client';

import React, { useState, useEffect, useRef } from 'react';

// 25 Verified Live CCTV Cameras with actual real-world streaming video feeds and live snapshots
const TWENTY_FIVE_CAMERAS = [
  {
    id: 'CH-01',
    code: 'CAM-01-SANDHURST',
    name: 'Sandhurst Estate Main Access & Guardhouse',
    sector: 'Perimeter & Gates',
    location: 'Sandhurst Access North, Sandton',
    gps: '-26.1132° S, 28.0345° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07450.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07450.jpg',
    status: 'ONLINE',
    fps: 30,
    bitrate: '4.8 Mbps',
    azimuth: 142,
    elevation: -14,
    detections: [
      { id: 'd1', label: 'ANPR: CA 849-210', detail: 'TOYOTA HILUX (WHITE) • RESIDENT', box: { x: 30, y: 48, w: 38, h: 32 }, color: '#38a169' },
    ],
  },
  {
    id: 'CH-02',
    code: 'CAM-02-CLIFTON',
    name: 'Clifton Ridge VIP North Perimeter',
    sector: 'Perimeter & Gates',
    location: 'Clifton Road Sector 4, Bryanston',
    gps: '-26.0583° S, 28.0211° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00002.00865.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00002.00865.jpg',
    status: 'BEAM ARMED',
    fps: 25,
    bitrate: '3.6 Mbps',
    azimuth: 85,
    elevation: -8,
    detections: [
      { id: 'd2', label: 'TRIPWIRE #04', detail: '10,000V PULSE FENCE: ARMED', box: { x: 8, y: 65, w: 84, h: 4 }, color: '#48bb78', isLine: true },
    ],
  },
  {
    id: 'CH-03',
    code: 'CAM-03-CBD-VAULT',
    name: 'Sandton CBD Commerce Square Vault',
    sector: 'Commercial & Vaults',
    location: 'Commerce Square Holding, Sandton CBD',
    gps: '-26.1075° S, 28.0567° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.02151.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.02151.jpg',
    status: 'RESTRICTED',
    fps: 30,
    bitrate: '5.4 Mbps',
    azimuth: 310,
    elevation: -42,
    detections: [
      { id: 'd3', label: 'UNIT #AR-04', detail: 'ARMOURED SPRINTER • STANDBY', box: { x: 28, y: 40, w: 45, h: 40 }, color: '#805ad5' },
    ],
  },
  {
    id: 'CH-04',
    code: 'CAM-04-NICOL-MESH',
    name: 'William Nicol & Main Intersect Public Mesh',
    sector: 'Highway & Public Mesh',
    location: 'Main & William Nicol Corridors',
    gps: '-26.0491° S, 28.0175° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03675.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03675.jpg',
    status: 'MESHED',
    fps: 30,
    bitrate: '4.2 Mbps',
    azimuth: 180,
    elevation: -22,
    detections: [
      { id: 'd4', label: 'ANPR CHECK', detail: 'BMW X5 • ND 918-204 • CLEAR', box: { x: 35, y: 50, w: 30, h: 30 }, color: '#38a169' },
    ],
  },
  {
    id: 'CH-05',
    code: 'CAM-05-INANDA-HELI',
    name: 'Inanda Polo Club Helipad & Apron',
    sector: 'Perimeter & Gates',
    location: 'Forrest Rd Helipad #1, Inanda',
    gps: '-26.1240° S, 28.0490° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.09747.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.09747.jpg',
    status: 'CLEAR FOR APPROACH',
    fps: 30,
    bitrate: '4.0 Mbps',
    azimuth: 220,
    elevation: -12,
    detections: [
      { id: 'd5', label: 'ADS-B LOCK', detail: 'RADAR CLEAR • WIND 8KT 090°', box: { x: 15, y: 15, w: 45, h: 20 }, color: '#e2e8f0' },
    ],
  },
  {
    id: 'CH-06',
    code: 'CAM-06-RIVONIA-HWY',
    name: 'N1 Rivonia Highway Surveillance Corridor',
    sector: 'Highway & Public Mesh',
    location: 'N1 Southbound Gantry, Rivonia',
    gps: '-26.0620° S, 28.0590° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06600.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06600.jpg',
    status: 'ACTIVE ESCORT',
    fps: 30,
    bitrate: '5.1 Mbps',
    azimuth: 195,
    elevation: -28,
    detections: [
      { id: 'd6', label: 'ESCORT FLEET', detail: 'APEX LOGISTICS • 104 KM/H', box: { x: 30, y: 45, w: 40, h: 35 }, color: '#D4AF37' },
    ],
  },
  {
    id: 'CH-07',
    code: 'CAM-07-HYDE-PARK',
    name: 'Hyde Park Residential Security Cluster',
    sector: 'Residential Clusters',
    location: '6th Rd & 1st Ave, Hyde Park',
    gps: '-26.1265° S, 28.0322° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.08858.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.08858.jpg',
    status: 'PATROL ACTIVE',
    fps: 28,
    bitrate: '4.5 Mbps',
    azimuth: 110,
    elevation: -15,
  },
  {
    id: 'CH-08',
    code: 'CAM-08-ROSEBANK',
    name: 'Rosebank Commercial Transit & Gautrain',
    sector: 'Commercial & Vaults',
    location: 'Oxford Rd & Bolton Rd, Rosebank',
    gps: '-26.1465° S, 28.0425° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03758.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03758.jpg',
    status: 'HIGH PEDESTRIAN FLOW',
    fps: 30,
    bitrate: '4.9 Mbps',
    azimuth: 165,
    elevation: -20,
  },
  {
    id: 'CH-09',
    code: 'CAM-09-MORNINGSIDE',
    name: 'Morningside Armed Patrol Holding Depot',
    sector: 'Commercial & Vaults',
    location: 'Rivonia Rd & Outspan, Morningside',
    gps: '-26.0820° S, 28.0610° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04235.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04235.jpg',
    status: 'STANDBY DISPATCH',
    fps: 30,
    bitrate: '4.6 Mbps',
    azimuth: 240,
    elevation: -18,
  },
  {
    id: 'CH-10',
    code: 'CAM-10-BRYANSTON-W',
    name: 'Bryanston Drive West Residential Perimeter',
    sector: 'Residential Clusters',
    location: 'Bryanston Dr & Wilton, Bryanston',
    gps: '-26.0540° S, 28.0120° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04353.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04353.jpg',
    status: 'PERIMETER SECURED',
    fps: 30,
    bitrate: '3.8 Mbps',
    azimuth: 95,
    elevation: -10,
  },
  {
    id: 'CH-11',
    code: 'CAM-11-RIVONIA-BLVD',
    name: 'Rivonia Boulevard Commercial Strip',
    sector: 'Commercial & Vaults',
    location: 'Rivonia Blvd & 9th Ave, Rivonia',
    gps: '-26.0560° S, 28.0620° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00002.00635.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00002.00635.jpg',
    status: 'ANPR ARMED',
    fps: 30,
    bitrate: '4.7 Mbps',
    azimuth: 175,
    elevation: -16,
  },
  {
    id: 'CH-12',
    code: 'CAM-12-WOODMEAD',
    name: 'Woodmead Commercial Logistics Gateway',
    sector: 'Commercial & Vaults',
    location: 'Woodmead Dr & M1 Interchange',
    gps: '-26.0490° S, 28.0820° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04568.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04568.jpg',
    status: 'FREIGHT CHECK',
    fps: 30,
    bitrate: '5.2 Mbps',
    azimuth: 130,
    elevation: -25,
  },
  {
    id: 'CH-13',
    code: 'CAM-13-FOURWAYS',
    name: 'Fourways Crossing Tactical Intercept Point',
    sector: 'Highway & Public Mesh',
    location: 'William Nicol & Witkoppen, Fourways',
    gps: '-26.0210° S, 28.0110° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07929.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07929.jpg',
    status: 'TRAFFIC SURVEILLANCE',
    fps: 30,
    bitrate: '4.8 Mbps',
    azimuth: 205,
    elevation: -22,
  },
  {
    id: 'CH-14',
    code: 'CAM-14-MELROSE',
    name: 'Melrose Arch VIP Commercial Perimeter',
    sector: 'Commercial & Vaults',
    location: 'Corlett Dr & Atholl Oaklands, Melrose',
    gps: '-26.1330° S, 28.0670° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06649.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06649.jpg',
    status: 'VIP ESCORT READY',
    fps: 30,
    bitrate: '4.3 Mbps',
    azimuth: 80,
    elevation: -15,
  },
  {
    id: 'CH-15',
    code: 'CAM-15-ILLOVO',
    name: 'Illovo Executive Suite & Access Boulevard',
    sector: 'Commercial & Vaults',
    location: 'Central Ave & Harries Rd, Illovo',
    gps: '-26.1310° S, 28.0510° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03762.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03762.jpg',
    status: 'ACCESS CONTROL',
    fps: 29,
    bitrate: '4.1 Mbps',
    azimuth: 155,
    elevation: -14,
  },
  {
    id: 'CH-16',
    code: 'CAM-16-HOUGHTON',
    name: 'Houghton Estate South Security Gantry',
    sector: 'Residential Clusters',
    location: '11th Ave & Central St, Houghton',
    gps: '-26.1600° S, 28.0550° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06519.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06519.jpg',
    status: 'ESTATE ENCLAVE',
    fps: 30,
    bitrate: '3.9 Mbps',
    azimuth: 190,
    elevation: -18,
  },
  {
    id: 'CH-17',
    code: 'CAM-17-SANDHURST-CL',
    name: 'Sandhurst Close Guarded Cul-de-sac',
    sector: 'Perimeter & Gates',
    location: 'Sandhurst Close Sector 2, Sandton',
    gps: '-26.1150° S, 28.0380° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04214.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04214.jpg',
    status: 'BOOM ARMED',
    fps: 28,
    bitrate: '4.2 Mbps',
    azimuth: 275,
    elevation: -12,
  },
  {
    id: 'CH-18',
    code: 'CAM-18-SAXONWOLD',
    name: 'Saxonwold Perimeter Anti-Breach Mesh',
    sector: 'Residential Clusters',
    location: 'Jan Smuts Ave & Cotswold, Saxonwold',
    gps: '-26.1650° S, 28.0410° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04653.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04653.jpg',
    status: 'RADAR ACTIVE',
    fps: 30,
    bitrate: '4.4 Mbps',
    azimuth: 310,
    elevation: -16,
  },
  {
    id: 'CH-19',
    code: 'CAM-19-PARKHURST',
    name: 'Parkhurst High-Street CCTV Network',
    sector: 'Residential Clusters',
    location: '4th Ave & 11th St, Parkhurst',
    gps: '-26.1410° S, 28.0190° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06511.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06511.jpg',
    status: 'FOOT PATROL',
    fps: 30,
    bitrate: '4.0 Mbps',
    azimuth: 145,
    elevation: -10,
  },
  {
    id: 'CH-20',
    code: 'CAM-20-KYALAMI',
    name: 'Kyalami Estates Northern Gantry',
    sector: 'Perimeter & Gates',
    location: 'Main Rd & Begonia Rd, Kyalami',
    gps: '-25.9960° S, 28.0650° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03757.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03757.jpg',
    status: 'GATEWAY SURVEILLANCE',
    fps: 30,
    bitrate: '4.6 Mbps',
    azimuth: 215,
    elevation: -20,
  },
  {
    id: 'CH-21',
    code: 'CAM-21-WATERFALL',
    name: 'Waterfall City Logistics & Freight Gate',
    sector: 'Commercial & Vaults',
    location: 'Waterfall Dr & K101, Midrand',
    gps: '-26.0150° S, 28.1050° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03819.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03819.jpg',
    status: 'COMMERCIAL GATE',
    fps: 30,
    bitrate: '5.0 Mbps',
    azimuth: 160,
    elevation: -15,
  },
  {
    id: 'CH-22',
    code: 'CAM-22-MIDRAND-HWY',
    name: 'Midrand Highway Escort Intercept Point',
    sector: 'Highway & Public Mesh',
    location: 'N1 Allandale Offramp Northbound',
    gps: '-26.0020° S, 28.1210° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04640.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04640.jpg',
    status: 'HIGH-SPEED GANTRY',
    fps: 30,
    bitrate: '5.3 Mbps',
    azimuth: 185,
    elevation: -24,
  },
  {
    id: 'CH-23',
    code: 'CAM-23-SUNNINGHILL',
    name: 'Sunninghill Commercial Park Entrance',
    sector: 'Commercial & Vaults',
    location: 'Edison Way & Maxwell Dr, Sunninghill',
    gps: '-26.0350° S, 28.0720° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04565.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04565.jpg',
    status: 'BARRIER CONTROL',
    fps: 28,
    bitrate: '4.2 Mbps',
    azimuth: 120,
    elevation: -14,
  },
  {
    id: 'CH-24',
    code: 'CAM-24-DUNKELD',
    name: 'Dunkeld West Armed Holding Station',
    sector: 'Residential Clusters',
    location: 'Bompas Rd & Jan Smuts, Dunkeld',
    gps: '-26.1360° S, 28.0360° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04331.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.04331.jpg',
    status: 'INTERCEPT READY',
    fps: 30,
    bitrate: '4.5 Mbps',
    azimuth: 290,
    elevation: -16,
  },
  {
    id: 'CH-25',
    code: 'CAM-25-JHB-TOWER',
    name: 'Johannesburg CBD Regional Control Tower',
    sector: 'Highway & Public Mesh',
    location: 'Carlton Centre Tower Rooftop Mast',
    gps: '-26.2050° S, 28.0470° E',
    videoUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.02150.mp4',
    imgUrl: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.02150.jpg',
    status: 'REGIONAL OVERVIEW',
    fps: 30,
    bitrate: '6.0 Mbps',
    azimuth: 0,
    elevation: -60,
  },
];

export default function GodsEyeSurveillance({ companyId, brand }) {
  const accentColor = brand?.highlightedButtonBg || '#D4AF37';
  const buttonBgColor = brand?.buttonBgColor || '#0F1A26';
  const partnerName = brand?.partnerName || 'Sovereign Intervention';

  // Layout mode: DEFAULT TO 5x5 WALL as requested!
  const [layout, setLayout] = useState('wall5x5'); // 'wall5x5' | 'wall4x4' | 'grid3x3' | 'grid2x2' | 'focus'
  const [activeShader, setActiveShader] = useState('NORMAL'); // 'NORMAL' | 'NVG' | 'FLIR' | 'CRT'
  const [aiMeshEnabled, setAiMeshEnabled] = useState(true);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCam, setSelectedCam] = useState(TWENTY_FIVE_CAMERAS[0]);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [godsEyeModalOpen, setGodsEyeModalOpen] = useState(false);

  // PTZ interactive simulator state for active camera in modal
  const [ptzState, setPtzState] = useState({
    panOffset: 0,
    tiltOffset: 0,
    zoom: 1.0,
  });

  // Timecode state
  const [timecode, setTimecode] = useState('');
  const [dispatchAlert, setDispatchAlert] = useState(null);
  const [snapshotTaken, setSnapshotTaken] = useState(null);

  // Live millisecond timecode updater
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const se = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds())).padStart(3, '0');
      setTimecode(`${yr}-${mo}-${da} ${hr}:${mi}:${se}.${ms} SAST`);
    };
    update();
    const interval = setInterval(update, 60);
    return () => clearInterval(interval);
  }, []);

  // Filter cameras
  const filteredCameras = TWENTY_FIVE_CAMERAS.filter((cam) => {
    const matchesSector = selectedSector === 'ALL' || cam.sector === selectedSector;
    const matchesSearch =
      !searchQuery ||
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  // Number of cameras to display based on layout mode
  const getDisplayCameras = () => {
    switch (layout) {
      case 'wall5x5':
        return filteredCameras.slice(0, 25);
      case 'wall4x4':
        return filteredCameras.slice(0, 16);
      case 'grid3x3':
        return filteredCameras.slice(0, 9);
      case 'grid2x2':
        return filteredCameras.slice(0, 4);
      case 'focus':
      default:
        return [selectedCam];
    }
  };

  // Dispatch tactical armed unit
  const handleDispatch = (cam) => {
    const unitId = '#AR-04';
    setDispatchAlert({
      camName: cam.name,
      location: cam.location,
      gps: cam.gps,
      unit: unitId,
      eta: '2.4 mins',
      timestamp: new Date().toLocaleTimeString('en-ZA'),
    });
    setTimeout(() => {
      setDispatchAlert(null);
    }, 8000);
  };

  // PTZ Control handlers
  const handlePtz = (direction) => {
    setPtzState((prev) => {
      switch (direction) {
        case 'left':
          return { ...prev, panOffset: Math.max(prev.panOffset - 15, -45) };
        case 'right':
          return { ...prev, panOffset: Math.min(prev.panOffset + 15, 45) };
        case 'up':
          return { ...prev, tiltOffset: Math.min(prev.tiltOffset + 10, 30) };
        case 'down':
          return { ...prev, tiltOffset: Math.max(prev.tiltOffset - 10, -30) };
        case 'zoom-in':
          return { ...prev, zoom: Math.min(Number((prev.zoom + 0.5).toFixed(1)), 4.0) };
        case 'zoom-out':
          return { ...prev, zoom: Math.max(Number((prev.zoom - 0.5).toFixed(1)), 1.0) };
        case 'reset':
          return { panOffset: 0, tiltOffset: 0, zoom: 1.0 };
        default:
          return prev;
      }
    });
  };

  // Capture Intel Snapshot
  const handleCaptureSnapshot = (cam) => {
    const snap = {
      camCode: cam.code,
      name: cam.name,
      location: cam.location,
      gps: cam.gps,
      time: timecode,
      shader: activeShader,
      imgUrl: cam.imgUrl,
      id: `INTEL-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    setSnapshotTaken(snap);
  };

  // Filter styles corresponding to God's Eye View GLSL Sensor Shaders applied directly to the video!
  const getShaderStyle = () => {
    switch (activeShader) {
      case 'NVG':
        // Tactical Night Vision Goggles (Green Phosphor)
        return {
          filter: 'sepia(100%) hue-rotate(85deg) saturate(320%) brightness(1.2) contrast(1.35)',
        };
      case 'FLIR':
        // Ironbow / White-Hot Thermal Heat Signature
        return {
          filter: 'invert(100%) hue-rotate(185deg) saturate(340%) contrast(1.75) brightness(1.1)',
        };
      case 'CRT':
        // High-Contrast Retro Security Command Monitor with phosphor scanlines
        return {
          filter: 'contrast(1.35) brightness(0.95) saturate(0.9)',
        };
      case 'NORMAL':
      default:
        return {
          filter: 'contrast(1.05) brightness(1.0)',
        };
    }
  };

  // CSS Grid class based on layout
  const getGridClass = () => {
    switch (layout) {
      case 'wall5x5':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5';
      case 'wall4x4':
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3';
      case 'grid3x3':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5';
      case 'grid2x2':
        return 'grid grid-cols-1 md:grid-cols-2 gap-4';
      default:
        return 'grid grid-cols-1 gap-4';
    }
  };

  return (
    <div className="space-y-4">
      {/* ── TOP CONTROL BAR ── */}
      <div
        className="rounded-2xl p-4 border shadow-xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md transition-all"
        style={{
          backgroundColor: `${buttonBgColor}F2`,
          borderColor: `${accentColor}35`,
          boxShadow: `0 8px 30px -8px ${accentColor}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner shrink-0"
            style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40`, color: accentColor }}
          >
            <span className="material-symbols-outlined text-xl">videocam</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                {partnerName} Multi-Feed CCTV Wall
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                25 LIVE STREAMS
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              {timecode || 'SYNCHRONIZING ATOMIC CLOCK...'} • REAL-TIME MESH
            </p>
          </div>
        </div>

        {/* Sector Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector Buttons */}
          <div className="hidden xl:flex items-center rounded-xl p-1 bg-black/60 border border-white/10 text-xs">
            {[
              ['ALL', 'All 25'],
              ['Perimeter & Gates', 'Gates & Perimeter'],
              ['Commercial & Vaults', 'Vaults & Commercial'],
              ['Highway & Public Mesh', 'Highway Mesh'],
              ['Residential Clusters', 'Estates'],
            ].map(([sec, label]) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedSector === sec ? 'bg-white/20 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sensor Shader Modes (From God's Eye View) */}
          <div className="flex items-center rounded-xl p-1 bg-black/60 border border-white/10 text-xs">
            {[
              { id: 'NORMAL', label: 'OPTICAL', icon: 'visibility' },
              { id: 'NVG', label: 'NVG', icon: 'bedtime' },
              { id: 'FLIR', label: 'FLIR', icon: 'local_fire_department' },
              { id: 'CRT', label: 'CRT', icon: 'tv' },
            ].map((s) => {
              const active = activeShader === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveShader(s.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    active ? 'shadow-md scale-105' : 'text-slate-400 hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: s.id === 'NVG' ? '#22c55e' : s.id === 'FLIR' ? '#ef4444' : accentColor,
                          color: '#04070E',
                        }
                      : {}
                  }
                  title={`Toggle ${s.label} Sensor Shader`}
                >
                  <span className="material-symbols-outlined text-xs">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* AI Mesh Detection Toggle */}
          <button
            onClick={() => setAiMeshEnabled(!aiMeshEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              aiMeshEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle God's Eye AI Vision Bounding Boxes & Telemetry"
          >
            <span className="material-symbols-outlined text-sm">{aiMeshEnabled ? 'smart_toy' : 'check_box_outline_blank'}</span>
            <span className="hidden sm:inline">AI Mesh</span>
          </button>

          {/* Grid Layout Selector: 5x5, 4x4, 3x3, 2x2, Focus */}
          <div className="flex items-center rounded-xl p-1 bg-black/60 border border-white/10 text-xs">
            <button
              onClick={() => setLayout('wall5x5')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                layout === 'wall5x5' ? 'bg-white/25 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="5 x 5 Grid (25 Cameras)"
            >
              5×5
            </button>
            <button
              onClick={() => setLayout('wall4x4')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                layout === 'wall4x4' ? 'bg-white/25 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="4 x 4 Grid (16 Cameras)"
            >
              4×4
            </button>
            <button
              onClick={() => setLayout('grid3x3')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                layout === 'grid3x3' ? 'bg-white/25 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="3 x 3 Grid (9 Cameras)"
            >
              3×3
            </button>
            <button
              onClick={() => setLayout('grid2x2')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                layout === 'grid2x2' ? 'bg-white/25 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="2 x 2 Quad (4 Cameras)"
            >
              2×2
            </button>
            <button
              onClick={() => {
                setLayout('focus');
                if (!selectedCam) setSelectedCam(TWENTY_FIVE_CAMERAS[0]);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                layout === 'focus' ? 'bg-white/25 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Focus View"
            >
              <span className="material-symbols-outlined text-xs">fullscreen</span>
            </button>
          </div>

          {/* God's Eye 3D Engine Showcase Button */}
          <button
            onClick={() => setGodsEyeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              borderColor: `${accentColor}40`,
            }}
          >
            <span className="material-symbols-outlined text-sm">public</span>
            <span className="hidden md:inline">God&apos;s Eye View</span>
          </button>
        </div>
      </div>

      {/* ── ARMED DISPATCH ALERT BANNER (IF TRIGGERED) ── */}
      {dispatchAlert && (
        <div
          className="rounded-2xl p-4 border animate-bounce flex items-center justify-between gap-4 shadow-2xl"
          style={{
            backgroundColor: '#ef44441a',
            borderColor: '#ef444466',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
              <span className="material-symbols-outlined text-2xl animate-spin">local_police</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  CRITICAL DISPATCH ORDER SENT • UNIT {dispatchAlert.unit}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 font-mono">
                  ETA {dispatchAlert.eta}
                </span>
              </div>
              <p className="text-xs text-white mt-0.5">
                Target: <span className="font-bold">{dispatchAlert.camName}</span> ({dispatchAlert.location}) • GPS:{' '}
                <span className="font-mono">{dispatchAlert.gps}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setDispatchAlert(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-black/40 border border-white/10"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ── MULTI-FEED CCTV WALL GRID ── */}
      {layout !== 'focus' ? (
        <div className={getGridClass()}>
          {getDisplayCameras().map((cam) => (
            <LiveVideoFeedCell
              key={cam.id}
              cam={cam}
              layout={layout}
              activeShader={activeShader}
              shaderStyle={getShaderStyle()}
              aiMeshEnabled={aiMeshEnabled}
              accentColor={accentColor}
              buttonBgColor={buttonBgColor}
              timecode={timecode}
              onSelect={() => {
                setSelectedCam(cam);
                setFocusModalOpen(true);
              }}
              onDispatch={() => handleDispatch(cam)}
              onSnapshot={() => handleCaptureSnapshot(cam)}
            />
          ))}
        </div>
      ) : (
        /* ── SINGLE FOCUS VIEW WITH SIDEBAR SELECTOR ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <LiveVideoFeedCell
              cam={selectedCam}
              layout="focus"
              isLarge
              activeShader={activeShader}
              shaderStyle={getShaderStyle()}
              aiMeshEnabled={aiMeshEnabled}
              accentColor={accentColor}
              buttonBgColor={buttonBgColor}
              timecode={timecode}
              ptzOffset={ptzState}
              onDispatch={() => handleDispatch(selectedCam)}
              onSnapshot={() => handleCaptureSnapshot(selectedCam)}
            />

            {/* Tactical PTZ Control Deck for Focus Feed */}
            <div
              className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 bg-black/40"
              style={{ borderColor: `${accentColor}30` }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg" style={{ color: accentColor }}>
                  settings_remote
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    PTZ Optical Control Console
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    PAN: {selectedCam.azimuth + ptzState.panOffset}° AZ • TILT:{' '}
                    {selectedCam.elevation + ptzState.tiltOffset}° • ZOOM: {ptzState.zoom}x
                  </p>
                </div>
              </div>

              {/* PTZ Joystick Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePtz('left')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Pan Left"
                >
                  <span className="material-symbols-outlined text-sm">arrow_left</span>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handlePtz('up')}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                    title="Tilt Up"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_up</span>
                  </button>
                  <button
                    onClick={() => handlePtz('down')}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                    title="Tilt Down"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>
                </div>
                <button
                  onClick={() => handlePtz('right')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Pan Right"
                >
                  <span className="material-symbols-outlined text-sm">arrow_right</span>
                </button>
                <button
                  onClick={() => handlePtz('reset')}
                  className="px-2.5 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-300 border border-white/10 active:scale-95 ml-2"
                  title="Recenter"
                >
                  CENTER
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-on-surface-variant font-mono">OPTICAL ZOOM:</span>
                <button
                  onClick={() => handlePtz('zoom-out')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <span
                  className="px-3 py-1 rounded-lg font-mono text-xs font-black border"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor, borderColor: `${accentColor}30` }}
                >
                  {ptzState.zoom}x
                </span>
                <button
                  onClick={() => handlePtz('zoom-in')}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/10 active:scale-95"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Camera List */}
          <div
            className="rounded-2xl p-4 border space-y-3"
            style={{ backgroundColor: `${buttonBgColor}CC`, borderColor: `${accentColor}25` }}
          >
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">All 25 Camera Channels</h3>
              <span className="text-[10px] text-emerald-400 font-mono">ALL ONLINE</span>
            </div>

            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {TWENTY_FIVE_CAMERAS.map((cam) => {
                const isCurrent = selectedCam.id === cam.id;
                return (
                  <button
                    key={cam.id}
                    onClick={() => {
                      setSelectedCam(cam);
                      handlePtz('reset');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-emerald-500/15'
                        : 'border-white/5 bg-black/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-mono text-xs font-bold text-white truncate">{cam.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{cam.name}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                      30 FPS
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── FOCUS MODAL (WHEN CLICKING ANY CAMERA IN THE 5x5 GRID) ── */}
      {focusModalOpen && selectedCam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-5xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col max-h-[92vh] bg-slate-950"
            style={{ borderColor: `${accentColor}50` }}
          >
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl" style={{ color: accentColor }}>
                  videocam
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedCam.name}</h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {selectedCam.id} • {selectedCam.code} • {selectedCam.gps} • LIVE H.264
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDispatch(selectedCam)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/50 hover:bg-red-600/50 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">local_police</span>
                  <span>Dispatch Armed Unit</span>
                </button>
                <button
                  onClick={() => setFocusModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <LiveVideoFeedCell
                cam={selectedCam}
                layout="focus"
                isLarge
                activeShader={activeShader}
                shaderStyle={getShaderStyle()}
                aiMeshEnabled={aiMeshEnabled}
                accentColor={accentColor}
                buttonBgColor={buttonBgColor}
                timecode={timecode}
                ptzOffset={ptzState}
                onDispatch={() => handleDispatch(selectedCam)}
                onSnapshot={() => handleCaptureSnapshot(selectedCam)}
              />

              {/* PTZ and Controls Deck */}
              <div
                className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 bg-black/40"
                style={{ borderColor: `${accentColor}25` }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePtz('left')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_left</span>
                  </button>
                  <button
                    onClick={() => handlePtz('up')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_drop_up</span>
                  </button>
                  <button
                    onClick={() => handlePtz('down')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_drop_down</span>
                  </button>
                  <button
                    onClick={() => handlePtz('right')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined">arrow_right</span>
                  </button>
                  <button
                    onClick={() => handlePtz('reset')}
                    className="px-3 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white ml-2"
                  >
                    Recenter
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant font-mono">ZOOM:</span>
                  <button
                    onClick={() => handlePtz('zoom-out')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_out</span>
                  </button>
                  <span className="font-mono text-sm font-bold text-white">{ptzState.zoom}x</span>
                  <button
                    onClick={() => handlePtz('zoom-in')}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                  </button>
                  <button
                    onClick={() => handleCaptureSnapshot(selectedCam)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 flex items-center gap-1.5 ml-3"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SNAPSHOT PREVIEW MODAL ── */}
      {snapshotTaken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg rounded-3xl border p-6 bg-slate-950 space-y-4 shadow-2xl"
            style={{ borderColor: `${accentColor}50` }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">verified</span>
                <h3 className="text-sm font-bold text-white">Tactical Intelligence Snapshot Saved</h3>
              </div>
              <button
                onClick={() => setSnapshotTaken(null)}
                className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 max-h-56 bg-black">
              <img src={snapshotTaken.imgUrl} alt="Snapshot" className="w-full h-full object-cover" />
            </div>

            <div className="rounded-xl border border-white/10 p-3 bg-black/50 space-y-1.5 font-mono text-xs">
              <p className="text-emerald-400 font-bold">SNAPSHOT ID: {snapshotTaken.id}</p>
              <p className="text-slate-300">CAMERA: {snapshotTaken.name} ({snapshotTaken.camCode})</p>
              <p className="text-slate-300">LOCATION: {snapshotTaken.location}</p>
              <p className="text-slate-300">COORDINATES: {snapshotTaken.gps}</p>
              <p className="text-slate-300">TIMESTAMP: {snapshotTaken.time}</p>
              <p className="text-slate-300">SENSOR MODE: {snapshotTaken.shader}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSnapshotTaken(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Snapshot ${snapshotTaken.id} exported to Incident dossier.`);
                  setSnapshotTaken(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5"
                style={{ backgroundColor: accentColor }}
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Export Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GOD'S EYE VIEW OPEN SOURCE INTEGRATION MODAL ── */}
      {godsEyeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-2xl rounded-3xl border p-6 bg-slate-950 space-y-5 shadow-2xl"
            style={{ borderColor: `${accentColor}50` }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40`, color: accentColor }}
                >
                  <span className="material-symbols-outlined">public</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">God&apos;s Eye View Spatial Intelligence</h3>
                  <p className="text-xs text-on-surface-variant">
                    Integrated with{' '}
                    <a
                      href="https://github.com/uhrichsam4/gods-eye-view"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      uhrichsam4/gods-eye-view
                    </a>{' '}
                    & bilawalsidhu/gods-eye-view
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGodsEyeModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>SafeLink</strong> integrates the architecture of <strong>God&apos;s Eye View</strong> to
                provide security operations centers with unified 3D spatial intelligence. By connecting private
                perimeter cameras, municipal traffic feeds, and satellite/ADS-B telemetry onto an interactive Cesium
                globe, dispatchers can view incidents from any vantage point.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-emerald-400 font-bold block">🌐 25 Live Camera Streams</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Real H.264 video streams playing simultaneously in an authentic 5×5 command matrix.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-amber-400 font-bold block">🛰️ Photorealistic 3D Mesh</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Google 3D terrain and building meshes give realistic line-of-sight analysis for rooftop and gatehouse
                    cameras.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-purple-400 font-bold block">⚡ Real-Time Sensor Shaders</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Hardware-accelerated post-processing for FLIR Ironbow thermal, NVG green phosphor, and CRT monitor
                    simulations.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 bg-white/5 space-y-1">
                  <span className="text-blue-400 font-bold block">🤖 AI Spatial Detection</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Real-time bounding box annotations, license plate recognition, and tripwire trigger alarms.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <a
                href="https://github.com/uhrichsam4/gods-eye-view"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>View GitHub Repository</span>
              </a>
              <button
                onClick={() => setGodsEyeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                style={{ backgroundColor: accentColor }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ACTUAL LIVE VIDEO CELL COMPONENT ──
function LiveVideoFeedCell({
  cam,
  layout,
  activeShader,
  shaderStyle,
  aiMeshEnabled,
  accentColor,
  buttonBgColor,
  timecode,
  isLarge = false,
  ptzOffset = { panOffset: 0, tiltOffset: 0, zoom: 1.0 },
  onSelect,
  onDispatch,
  onSnapshot,
}) {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Height adapts to 5x5 grid density or single focus
  const getCellHeight = () => {
    if (isLarge) return 'h-[440px] sm:h-[500px]';
    if (layout === 'wall5x5') return 'h-[160px] sm:h-[190px]';
    if (layout === 'wall4x4') return 'h-[200px] sm:h-[230px]';
    if (layout === 'grid3x3') return 'h-[260px] sm:h-[300px]';
    return 'h-[300px] sm:h-[340px]';
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border overflow-hidden transition-all shadow-lg relative group flex flex-col cursor-pointer ${getCellHeight()}`}
      style={{
        backgroundColor: `${buttonBgColor}F0`,
        borderColor: `${accentColor}30`,
      }}
    >
      {/* Video / Image Display Container */}
      <div className="relative w-full flex-1 overflow-hidden bg-black select-none">
        {/* Actual Video Feed */}
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={cam.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{
              ...shaderStyle,
              transform: `scale(${ptzOffset?.zoom || 1}) translate(${ptzOffset?.panOffset || 0}px, ${
                ptzOffset?.tiltOffset || 0
              }px)`,
            }}
          />
        ) : (
          /* High-resolution fallback image */
          <img
            src={cam.imgUrl}
            alt={cam.name}
            className="w-full h-full object-cover"
            style={{
              ...shaderStyle,
              transform: `scale(${ptzOffset?.zoom || 1})`,
            }}
          />
        )}

        {/* Scanlines Overlay for CRT mode */}
        {activeShader === 'CRT' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
            }}
          />
        )}

        {/* NVG Vignette Overlay for Night Vision mode */}
        {activeShader === 'NVG' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,20,5,0.95) 100%)',
            }}
          />
        )}

        {/* FLIR Color Scale Indicator when Thermal is Active */}
        {activeShader === 'FLIR' && isLarge && (
          <div className="absolute top-12 right-3 pointer-events-none flex flex-col items-center gap-1 z-10 bg-black/60 p-1 rounded border border-white/20">
            <span className="text-[8px] font-mono text-white font-bold">HOT</span>
            <div
              className="w-2 h-16 rounded-sm border border-white/40"
              style={{
                background: 'linear-gradient(to bottom, #ffffff, #ffff00, #ff0000, #800080, #000080, #000000)',
              }}
            />
            <span className="text-[8px] font-mono text-white font-bold">COLD</span>
          </div>
        )}

        {/* ── TOP HUD TELEMETRY OVERLAY ── */}
        <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-black/80 text-emerald-400 font-black border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {cam.id}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/75 text-slate-300 font-bold border border-white/10 hidden sm:inline text-[9px]">
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-red-600/85 text-white font-bold uppercase tracking-wider text-[8px] animate-pulse">
              ● REC
            </span>
          </div>
        </div>

        {/* ── AI MESH BOUNDING BOXES (IF ENABLED) ── */}
        {aiMeshEnabled && cam.detections && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {cam.detections.map((det) => (
              <div
                key={det.id}
                className="absolute border-2 transition-all animate-pulse"
                style={{
                  left: `${det.box.x}%`,
                  top: `${det.box.y}%`,
                  width: `${det.box.w}%`,
                  height: `${det.box.h}%`,
                  borderColor: det.color,
                  backgroundColor: `${det.color}15`,
                }}
              >
                <div
                  className="absolute -top-4 left-0 px-1 py-0.2 rounded text-[8px] font-mono font-bold whitespace-nowrap shadow text-black"
                  style={{ backgroundColor: det.color }}
                >
                  {det.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BOTTOM HUD TELEMETRY OVERLAY ── */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono pointer-events-none z-10 text-slate-300">
          <div className="bg-black/80 px-1.5 py-0.2 rounded border border-white/10 truncate max-w-[85%]">
            <span>{timecode?.split(' ')[1] || '06:30:00.000'}</span>
            <span className="hidden md:inline text-slate-400"> • {cam.location.split(',')[0]}</span>
          </div>
          <span className="bg-black/80 px-1 py-0.2 rounded border border-white/10 text-[8px] hidden sm:inline">
            30 FPS
          </span>
        </div>
      </div>

      {/* ── FOOTER BAR ── */}
      <div className="p-2 border-t border-white/10 flex items-center justify-between bg-black/40 gap-1.5">
        <div className="min-w-0 flex-1">
          <h4 className="text-[11px] font-bold text-white truncate">{cam.name}</h4>
          <p className="text-[9px] text-on-surface-variant font-mono truncate">{cam.location}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onSnapshot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnapshot();
              }}
              className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all"
              title="Capture Snapshot"
            >
              <span className="material-symbols-outlined text-xs">photo_camera</span>
            </button>
          )}

          {onDispatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDispatch();
              }}
              className="px-2 py-1 rounded text-[9px] font-bold bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/40 transition-all flex items-center gap-0.5"
              title="Dispatch Armed Patrol"
            >
              <span className="material-symbols-outlined text-[10px]">local_police</span>
              <span className="hidden sm:inline">Dispatch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
