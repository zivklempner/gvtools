import { ApplicationDetection } from '@/api/entities';

/**
 * Simulates detecting applications on a system
 * In a real-world scenario, this would interface with system tools
 */
export default function ApplicationDetector() {
  // This is a component that doesn't render anything
  // but provides the detectApplications function
  return null;
}

// Browser-friendly application detector function
export async function detectApplications(scanId) {
  console.log(`Simulating application detection for scan ${scanId}`);
  
  // Sample data for demonstration
  const detectedApps = [
    {
      application_name: "postgresql",
      category: "database",
      version: "13.4",
      detection_method: "package",
      graviton_compatibility_status: "compatible",
      compatibility_notes: "PostgreSQL is fully compatible with AWS Graviton processors",
      scan_id: scanId
    },
    {
      application_name: "redis",
      category: "database",
      version: "6.2.5",
      detection_method: "process",
      graviton_compatibility_status: "compatible",
      compatibility_notes: "Redis is compatible with AWS Graviton processors",
      scan_id: scanId
    }
  ];
  
  // Store detection results
  for (const app of detectedApps) {
    await ApplicationDetection.create(app);
  }
  
  return detectedApps;
}