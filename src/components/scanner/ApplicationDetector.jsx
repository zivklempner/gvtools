
import { ApplicationDetection } from '@/api/entities';

const APPLICATIONS = {
  postgresql: {
    category: "database",
    processes: ["postgres", "postgresql"],
    packages: ["postgresql", "postgresql-server"],
    configPaths: ["/etc/postgresql/", "/var/lib/pgsql/data/postgresql.conf"],
    versionCommands: [
      "postgres -V",
      "psql --version",
      "pg_config --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:postgres|psql|PostgreSQL)\D*([\d\.]+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "14"
  },
  redis: {
    category: "database",
    processes: ["redis-server"],
    packages: ["redis-server", "redis"],
    configPaths: ["/etc/redis/redis.conf", "/usr/local/etc/redis/redis.conf"],
    versionCommands: [
      "redis-server --version",
      "redis-cli --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/v=(\d+\.\d+\.\d+)/i) || output.match(/version\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "6.2"
  },
  mongodb: {
    category: "database",
    processes: ["mongod"],
    packages: ["mongodb-org", "mongodb-org-server", "mongodb"],
    configPaths: ["/etc/mongod.conf", "/etc/mongodb.conf"],
    versionCommands: [
      "mongod --version",
      "mongo --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/db\s*version\s*v?(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "5.0"
  },
  mysql: {
    category: "database",
    processes: ["mysqld", "mariadbd"],
    packages: ["mysql-server", "mariadb-server"],
    configPaths: ["/etc/mysql/my.cnf", "/etc/my.cnf"],
    versionCommands: [
      "mysql --version",
      "mysqld --version",
      "mariadbd --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:Ver|version)\s+(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "8.0"
  },
  kafka: {
    category: "message_queue",
    processes: ["kafka.Kafka"],
    packages: ["kafka", "kafka-server"],
    configPaths: [
      "/etc/kafka/server.properties",
      "/opt/kafka/config/server.properties",
      "/usr/local/kafka/config/server.properties"
    ],
    versionCommands: [
      "kafka-server-start.sh --version",
      "find /opt/kafka/libs -name 'kafka_*jar' | head -n1" // Gets JAR filename which often contains version
    ],
    parseVersion: (output) => {
      // Check for direct version output
      let match = output.match(/version\s*(\d+\.\d+\.\d+)/i);
      if (match) return match[1];
      
      // Check JAR filename pattern
      match = output.match(/kafka_\d+\.\d+-(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "3.0"
  },
  aerospike: {
    category: "database",
    processes: ["asd"],
    packages: ["aerospike", "aerospike-server"],
    configPaths: ["/etc/aerospike/aerospike.conf"],
    versionCommands: [
      "asd --version",
      "asinfo -v 'build'"  // Aerospike CLI tool
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:version|build)\s*[:\s]\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "5.0"
  },
  rabbitmq: {
    category: "message_queue",
    processes: ["rabbitmq-server", "beam.smp"],
    packages: ["rabbitmq-server"],
    configPaths: ["/etc/rabbitmq/rabbitmq.conf"],
    versionCommands: [
      "rabbitmqctl version",
      "rabbitmq-server -v"
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:rabbitmq|version)\s*(?:server)?\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "3.9"
  },
  elasticsearch: {
    category: "search_engine",
    processes: ["elasticsearch"],
    packages: ["elasticsearch"],
    configPaths: [
      "/etc/elasticsearch/elasticsearch.yml",
      "/usr/local/etc/elasticsearch/elasticsearch.yml"
    ],
    versionCommands: [
      "elasticsearch --version",
      "curl -s localhost:9200"  // Returns JSON with version
    ],
    parseVersion: (output) => {
      // Try to parse JSON response from curl
      try {
        if (output.includes('"version"')) {
          const jsonMatch = JSON.parse(output);
          if (jsonMatch.version && jsonMatch.version.number) {
            return jsonMatch.version.number;
          }
        }
      } catch (e) {
        // Fall back to regex if JSON parsing fails
      }
      
      const match = output.match(/elasticsearch\s*(?:version:)?\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "7.10"
  },
  opensearch: {
    category: "search_engine",
    processes: ["opensearch"],
    packages: ["opensearch"],
    configPaths: [
      "/etc/opensearch/opensearch.yml",
      "/usr/local/etc/opensearch/opensearch.yml"
    ],
    versionCommands: [
      "opensearch --version",
      "curl -s localhost:9200"  // Returns JSON with version
    ],
    parseVersion: (output) => {
      // Try to parse JSON response from curl
      try {
        if (output.includes('"version"')) {
          const jsonMatch = JSON.parse(output);
          if (jsonMatch.version && jsonMatch.version.number) {
            return jsonMatch.version.number;
          }
        }
      } catch (e) {
        // Fall back to regex if JSON parsing fails
      }
      
      const match = output.match(/opensearch\s*(?:version:)?\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "1.2"
  },
  docker: {
    category: "container_orchestration",
    processes: ["dockerd", "docker"],
    packages: ["docker-ce", "docker-engine", "docker.io"],
    configPaths: [
      "/etc/docker/daemon.json",
      "/var/run/docker.sock"
    ],
    versionCommands: [
      "docker --version",
      "docker version"
    ],
    parseVersion: (output) => {
      const match = output.match(/Docker version\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "20.10"
  },
  kubernetes: {
    category: "container_orchestration",
    processes: ["kubelet", "kube-apiserver", "k3s"],
    packages: ["kubernetes-cni", "kubeadm", "kubectl", "k3s"],
    configPaths: [
      "/etc/kubernetes/",
      "/var/lib/kubelet/config.yaml",
      "/etc/rancher/k3s/"
    ],
    versionCommands: [
      "kubectl version --client",
      "kubelet --version",
      "k3s --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:Client|Server|k3s) Version: v?(\d+\.\d+\.\d+)/i) || 
                    output.match(/Kubernetes v?(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "1.23"
  },
  jenkins: {
    category: "ci_cd",
    processes: ["jenkins"],
    packages: ["jenkins"],
    configPaths: [
      "/etc/default/jenkins",
      "/var/lib/jenkins/config.xml"
    ],
    versionCommands: [
      "jenkins --version",
      "java -jar /usr/share/jenkins/jenkins.war --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/(?:jenkins|version)\s*(?:version)?\s*(?:is)?\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "2.346"
  },
  gitlab_runner: {
    category: "ci_cd",
    processes: ["gitlab-runner"],
    packages: ["gitlab-runner"],
    configPaths: [
      "/etc/gitlab-runner/config.toml"
    ],
    versionCommands: [
      "gitlab-runner --version"
    ],
    parseVersion: (output) => {
      const match = output.match(/Version:\s*(\d+\.\d+\.\d+)/i);
      return match ? match[1] : null;
    },
    defaultVersion: "14.0"
  }
};

class DetectionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DetectionError';
    this.details = details;
  }
}

export async function detectApplications(scanId) {
  // In a browser environment, we'll return simulated application detections
  // instead of actually scanning the system
  console.log(`Simulating application detection for scan ${scanId}`);
  
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
    },
    {
      application_name: "nginx",
      category: "other",
      version: "1.18.0",
      detection_method: "package",
      graviton_compatibility_status: "compatible",
      compatibility_notes: "Nginx is compatible with AWS Graviton processors",
      scan_id: scanId
    }
  ];
  
  // In a real implementation, we would save these to the database
  // But for simulation, we'll just return them
  for (const app of detectedApps) {
    await ApplicationDetection.create(app);
  }
  
  return detectedApps;
}
