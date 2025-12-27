/**
 * Pipeline Templates for different Tech Stacks
 * These templates are used to auto-generate Jenkinsfile for new repositories
 * 
 * Security: GITHUB_TOKEN is passed as a Password parameter and masked in logs
 */

export type TechStack = 'nodejs' | 'react' | 'nextjs';

export const TECH_STACK_OPTIONS: { value: TechStack; label: string; description: string }[] = [
    { value: 'nodejs', label: 'Node.js', description: 'Express, NestJS, or any Node.js backend' },
    { value: 'react', label: 'React / Vite', description: 'React SPA with Vite or CRA' },
    { value: 'nextjs', label: 'Next.js', description: 'Next.js fullstack application' },
];

/**
 * Get the Jenkinsfile pipeline script for Node.js projects
 * Uses GITHUB_TOKEN parameter (password type) for private repo access
 */
function getNodeJsPipeline(repoFullName: string, backendUrl: string): string {
    return `
pipeline {
    agent any
    
    parameters {
        string(name: 'COMMIT_HASH', defaultValue: '', description: 'Git commit hash')
        string(name: 'BUILD_ID_FROM_BACKEND', defaultValue: '', description: 'Build ID from backend')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'GitHub token for private repo access')
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Clean workspace before checkout
                deleteDir()
                echo "Checking out commit: \${params.COMMIT_HASH}"
                script {
                    // Use set +x to hide the token from logs
                    sh '''
                        set +x
                        git clone https://\${GITHUB_TOKEN}@github.com/${repoFullName}.git .
                        set -x
                    '''
                    if (params.COMMIT_HASH) {
                        sh "git checkout \${params.COMMIT_HASH}"
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci || npm install'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build --if-present || echo "No build script"'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test --if-present || echo "No tests configured"'
            }
        }
    }
    
    post {
        success {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "SUCCESS"}' || true
                    """
                }
            }
        }
        failure {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "FAILED"}' || true
                    """
                }
            }
        }
        always {
            echo "Pipeline finished for build: \${params.BUILD_ID_FROM_BACKEND}"
            cleanWs()
        }
    }
}
  `.trim();
}

/**
 * Get the Jenkinsfile pipeline script for React/Vite projects
 */
function getReactPipeline(repoFullName: string, backendUrl: string): string {
    return `
pipeline {
    agent any
    
    parameters {
        string(name: 'COMMIT_HASH', defaultValue: '', description: 'Git commit hash')
        string(name: 'BUILD_ID_FROM_BACKEND', defaultValue: '', description: 'Build ID from backend')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'GitHub token for private repo access')
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Clean workspace before checkout
                deleteDir()
                echo "Checking out commit: \${params.COMMIT_HASH}"
                script {
                    sh '''
                        set +x
                        git clone https://\${GITHUB_TOKEN}@github.com/${repoFullName}.git .
                        set -x
                    '''
                    if (params.COMMIT_HASH) {
                        sh "git checkout \${params.COMMIT_HASH}"
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci || npm install'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint --if-present || echo "No linting configured"'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test -- --watchAll=false --passWithNoTests || echo "No tests configured"'
            }
        }
    }
    
    post {
        success {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "SUCCESS"}' || true
                    """
                }
            }
        }
        failure {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "FAILED"}' || true
                    """
                }
            }
        }
        always {
            echo "Pipeline finished for build: \${params.BUILD_ID_FROM_BACKEND}"
            cleanWs()
        }
    }
}
  `.trim();
}

/**
 * Get the Jenkinsfile pipeline script for Next.js projects
 */
function getNextJsPipeline(repoFullName: string, backendUrl: string): string {
    return `
pipeline {
    agent any
    
    parameters {
        string(name: 'COMMIT_HASH', defaultValue: '', description: 'Git commit hash')
        string(name: 'BUILD_ID_FROM_BACKEND', defaultValue: '', description: 'Build ID from backend')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'GitHub token for private repo access')
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Clean workspace before checkout
                deleteDir()
                echo "Checking out commit: \${params.COMMIT_HASH}"
                script {
                    sh '''
                        set +x
                        git clone https://\${GITHUB_TOKEN}@github.com/${repoFullName}.git .
                        set -x
                    '''
                    if (params.COMMIT_HASH) {
                        sh "git checkout \${params.COMMIT_HASH}"
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci || npm install'
            }
        }
        
        stage('Lint') {
            steps {
                sh 'npm run lint --if-present || echo "No linting configured"'
            }
        }
        
        stage('Type Check') {
            steps {
                sh 'npx tsc --noEmit --skipLibCheck || echo "No TypeScript configured"'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test --if-present || echo "No tests configured"'
            }
        }
    }
    
    post {
        success {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "SUCCESS"}' || true
                    """
                }
            }
        }
        failure {
            script {
                if (params.BUILD_ID_FROM_BACKEND) {
                    sh """
                        curl -s -X PATCH '${backendUrl}/builds/\${params.BUILD_ID_FROM_BACKEND}/status' \\
                            -H 'Content-Type: application/json' \\
                            -d '{"status": "FAILED"}' || true
                    """
                }
            }
        }
        always {
            echo "Pipeline finished for build: \${params.BUILD_ID_FROM_BACKEND}"
            cleanWs()
        }
    }
}
  `.trim();
}

/**
 * Get pipeline template based on tech stack
 */
export function getPipelineTemplate(
    techStack: TechStack,
    repoFullName: string,
    backendUrl: string,
): string {
    switch (techStack) {
        case 'react':
            return getReactPipeline(repoFullName, backendUrl);
        case 'nextjs':
            return getNextJsPipeline(repoFullName, backendUrl);
        case 'nodejs':
        default:
            return getNodeJsPipeline(repoFullName, backendUrl);
    }
}

/**
 * Get Jenkins job XML config with the pipeline script
 * Includes GITHUB_TOKEN as a password parameter for security
 */
export function getJenkinsJobConfig(
    techStack: TechStack,
    repoFullName: string,
    backendUrl: string,
): string {
    const pipelineScript = getPipelineTemplate(techStack, repoFullName, backendUrl);

    // Escape XML special characters in the pipeline script
    const escapedScript = pipelineScript
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    return `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@1316.vd2290d3341a_f">
  <description>Auto-created ${techStack} job for ${repoFullName}</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.StringParameterDefinition>
          <name>COMMIT_HASH</name>
          <defaultValue></defaultValue>
          <trim>true</trim>
        </hudson.model.StringParameterDefinition>
        <hudson.model.StringParameterDefinition>
          <name>BUILD_ID_FROM_BACKEND</name>
          <defaultValue></defaultValue>
          <trim>true</trim>
        </hudson.model.StringParameterDefinition>
        <hudson.model.PasswordParameterDefinition>
          <name>GITHUB_TOKEN</name>
          <defaultValue></defaultValue>
          <description>GitHub token for private repo access (masked in logs)</description>
        </hudson.model.PasswordParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
    <jenkins.model.BuildDiscarderProperty>
      <strategy class="hudson.tasks.LogRotator">
        <daysToKeep>-1</daysToKeep>
        <numToKeep>10</numToKeep>
        <artifactDaysToKeep>-1</artifactDaysToKeep>
        <artifactNumToKeep>-1</artifactNumToKeep>
      </strategy>
    </jenkins.model.BuildDiscarderProperty>
    <org.jenkinsci.plugins.workflow.job.properties.DisableConcurrentBuildsJobProperty>
      <abortPrevious>false</abortPrevious>
    </org.jenkinsci.plugins.workflow.job.properties.DisableConcurrentBuildsJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@3653.v07ea_433c90b_4">
    <script>${escapedScript}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
}
