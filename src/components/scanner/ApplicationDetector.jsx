import { exec } from 'child_process';
import { promisify } from 'util';
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
  const detectedApps = [];
  const errors = [];

  // Enhanced command execution with timeout and error handling
  const runCommand = async (cmd, timeout = 5000) => {
    try {
      const execAsync = promisify(exec);
      const { stdout, stderr } = await Promise.race([
        execAsync(cmd),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Command timed out')), timeout)
        )
      ]);
      
      if (stderr) {
        console.warn(`Warning executing ${cmd}:`, stderr);
      }
      
      return stdout;
    } catch (error) {
      // Don't throw on ENOENT (command not found) or non-zero exit codes
      if (error.code === 'ENOENT' || error.cmd) {
        return '';
      }
      throw new DetectionError(`Error executing command: ${cmd}`, {
        command: cmd,
        error: error.message,
        code: error.code
      });
    }
  };

  // Enhanced version detection
  const detectVersion = async (app, appConfig) => {
    let version = null;
    const versionAttempts = [];

    // Try specific version commands first
    if (appConfig.versionCommands) {
      for (const cmd of appConfig.versionCommands) {
        try {
          const output = await runCommand(cmd);
          if (output) {
            versionAttempts.push({ command: cmd, output });
            if (appConfig.parseVersion) {
              const parsedVersion = appConfig.parseVersion(output);
              if (parsedVersion) {
                version = parsedVersion;
                break;
              }
            } else {
              // Default version parsing if no custom parser
              const match = output.match(/(\d+\.\d+\.\d+)/);
              if (match) {
                version = match[1];
                break;
              }
            }
          }
        } catch (error) {
          // Just try the next command
          console.warn(`Version detection error for ${app}:`, error.message);
        }
      }
    }

    // If no version found, try to parse from config files
    if (!version && appConfig.configPaths) {
      for (const configPath of appConfig.configPaths) {
        try {
          const configContent = await runCommand(`cat ${configPath}`);
          if (configContent) {
            const match = configContent.match(/version\s*[=:]\s*["']?(\d+\.\d+\.\d+)["']?/i);
            if (match) {
              version = match[1];
              break;
            }
          }
        } catch (error) {
          // Just try the next config
        }
      }
    }

    // Return results
    return {
      version: version || appConfig.defaultVersion,
      attemptedCommands: versionAttempts
    };
  };

  try {
    // Get running processes
    const processOutput = await runCommand('ps aux');
    
    // Get installed packages (try both dpkg and rpm)
    const dpkgOutput = await runCommand('dpkg -l');
    const rpmOutput = await runCommand('rpm -qa');
    
    // Check each application
    for (const [appName, appConfig] of Object.entries(APPLICATIONS)) {
      try {
        let detected = false;
        let detectionMethod = null;
        
        // 1. Process Detection
        const processFound = appConfig.processes.some(proc => 
          processOutput.toLowerCase().includes(proc.toLowerCase())
        );
        
        if (processFound) {
          detected = true;
          detectionMethod = 'process';
        }
        
        // 2. Package Detection
        if (!detected) {
          // Check Debian packages
          const dpkgFound = appConfig.packages.some(pkg => 
            dpkgOutput.match(new RegExp(`${pkg}\\s+`, 'i'))
          );
          
          // Check RPM packages
          const rpmFound = appConfig.packages.some(pkg => 
            rpmOutput.match(new RegExp(`${pkg}-`, 'i'))
          );
          
          if (dpkgFound || rpmFound) {
            detected = true;
            detectionMethod = 'package';
          }
        }
        
        // 3. Configuration File Detection
        if (!detected) {
          for (const configPath of appConfig.configPaths) {
            const configExists = await runCommand(`test -e ${configPath} && echo "exists"`);
            if (configExists.includes('exists')) {
              detected = true;
              detectionMethod = 'config_file';
              break;
            }
          }
        }
        
        if (detected) {
          // Get version
          const { version, attemptedCommands } = await detectVersion(appName, appConfig);
          
          // Determine Graviton compatibility
          let gravitonCompatibilityStatus = 'unknown';
          let compatibilityNotes = '';
          
          // Logic to determine compatibility based on application and version
          if (appName === 'postgresql' || appName === 'mysql' || appName === 'redis') {
            gravitonCompatibilityStatus = 'compatible';
            compatibilityNotes = 'Fully compatible with AWS Graviton processors';
          } else if (appName === 'aerospike') {
            if (version && version.split('.')[0] >= '6') {
              gravitonCompatibilityStatus = 'compatible';
              compatibilityNotes = 'Version 6.0 and later are compatible with ARM64';
            } else {
              gravitonCompatibilityStatus = 'not_compatible';
              compatibilityNotes = 'Versions before 6.0 do not support ARM64 architecture; upgrade required';
            }
          } else if (appName === 'elasticsearch' || appName === 'opensearch') {
            gravitonCompatibilityStatus = 'partial';
            compatibilityNotes = 'Requires JVM tuning for optimal performance on Graviton';
          } else if (appName === 'kafka') {
            gravitonCompatibilityStatus = 'compatible';
            compatibilityNotes = 'Requires tuned JVM settings for optimal Graviton performance';
          } else if (appName === 'jenkins') {
            gravitonCompatibilityStatus = 'partial';
            compatibilityNotes = 'Base system works but some plugins may have issues';
          }
          
          // Create application record
          const appRecord = {
            scan_id: scanId,
            application_name: appName,
            category: appConfig.category,
            version: version,
            detection_method: detectionMethod,
            graviton_compatibility_status: gravitonCompatibilityStatus,
            compatibility_notes: compatibilityNotes,
            detection_details: {
              version_detection: attemptedCommands,
              process_match: processFound,
              config_paths: appConfig.configPaths.filter(async path => {
                try {
                  return (await runCommand(`test -e ${path} && echo "exists"`)).includes('exists');
                } catch (e) {
                  return false;
                }
              })
            }
          };
          
          // Add to database
          const createdApp = await ApplicationDetection.create(appRecord);
          detectedApps.push(createdApp);
        }
      } catch (error) {
        errors.push(new DetectionError(`Error detecting ${appName}`, {
          application: appName,
          error: error.message,
          stack: error.stack
        }));
      }
    }
    
    return { detectedApplications: detectedApps, errors };
  } catch (error) {
    errors.push(new DetectionError("Fatal error during application detection", {
      error: error.message,
      stack: error.stack
    }));
    return { detectedApplications: [], errors };
  }
}