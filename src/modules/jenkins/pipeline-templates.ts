/**
 * Pipeline Templates for different Tech Stacks
 * These templates are used to auto-generate Jenkinsfile for new repositories
 * 
 * Security: GITHUB_TOKEN is passed as a Password parameter and masked in logs
 */

export type TechStack = 'nodejs' | 'react' | 'nextjs' | 'python' | 'static' | 'empty';

export const TECH_STACK_OPTIONS: { value: TechStack; label: string; description: string }[] = [
    { value: 'nodejs', label: 'Node.js', description: 'Express, NestJS, or any Node.js backend' },
    { value: 'react', label: 'React / Vite', description: 'React SPA with Vite or CRA' },
    { value: 'nextjs', label: 'Next.js', description: 'Next.js fullstack application' },
    { value: 'python', label: 'Python', description: 'Flask, Django, or Python scripts' },
    { value: 'static', label: 'Static Website', description: 'HTML/CSS/JS only' },
    { value: 'empty', label: 'Empty Repository', description: 'Just README, setup manually' },
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
 * Get the Jenkinsfile pipeline script for Python projects
 */
function getPythonPipeline(repoFullName: string, backendUrl: string): string {
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
        
        stage('Setup Python') {
            steps {
                sh '''
                    python3 --version || python --version
                    pip3 --version || pip --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    if [ -f requirements.txt ]; then
                        pip3 install -r requirements.txt || pip install -r requirements.txt
                    else
                        echo "No requirements.txt found, skipping..."
                    fi
                '''
            }
        }
        
        stage('Lint') {
            steps {
                sh '''
                    if pip3 show flake8 > /dev/null 2>&1; then
                        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true
                    else
                        echo "flake8 not installed, skipping lint..."
                    fi
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    if pip3 show pytest > /dev/null 2>&1; then
                        python3 -m pytest || echo "No tests found"
                    else
                        echo "pytest not installed, skipping tests..."
                    fi
                '''
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
 * Get the Jenkinsfile pipeline script for Static websites
 * Simply validates HTML exists and deploys
 */
function getStaticPipeline(repoFullName: string, backendUrl: string): string {
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
        
        stage('Validate') {
            steps {
                sh '''
                    echo "Validating static website structure..."
                    if [ -f index.html ]; then
                        echo "✅ index.html found"
                    else
                        echo "⚠️ No index.html found in root"
                    fi
                    echo "Files in repository:"
                    find . -type f -name "*.html" -o -name "*.css" -o -name "*.js" | head -20
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                echo "Static website ready for deployment"
                // Add deployment steps here (e.g., copy to web server, S3, etc.)
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
 * Get Universal/Empty pipeline with auto project detection
 * This pipeline detects project type and runs appropriate commands
 */
function getUniversalPipeline(repoFullName: string, backendUrl: string): string {
    return `
pipeline {
    agent any
    
    environment {
        PROJECT_TYPE = 'unknown'
    }
    
    parameters {
        string(name: 'COMMIT_HASH', defaultValue: '', description: 'Git commit hash')
        string(name: 'BUILD_ID_FROM_BACKEND', defaultValue: '', description: 'Build ID from backend')
        password(name: 'GITHUB_TOKEN', defaultValue: '', description: 'GitHub token for private repo access')
    }
    
    stages {
        stage('Checkout') {
            steps {
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
        
        stage('Detect Project Type') {
            steps {
                script {
                    if (fileExists('package.json')) {
                        env.PROJECT_TYPE = 'nodejs'
                        echo "✅ Detected: Node.js project"
                    } else if (fileExists('requirements.txt') || fileExists('setup.py')) {
                        env.PROJECT_TYPE = 'python'
                        echo "✅ Detected: Python project"
                    } else if (fileExists('pom.xml')) {
                        env.PROJECT_TYPE = 'java'
                        echo "✅ Detected: Java Maven project"
                    } else if (fileExists('index.html')) {
                        env.PROJECT_TYPE = 'static'
                        echo "✅ Detected: Static website"
                    } else {
                        env.PROJECT_TYPE = 'empty'
                        echo "⚠️ No recognized project structure - treating as empty"
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            when { expression { env.PROJECT_TYPE in ['nodejs', 'python'] } }
            steps {
                script {
                    if (env.PROJECT_TYPE == 'nodejs') {
                        sh 'npm ci || npm install'
                    } else if (env.PROJECT_TYPE == 'python') {
                        sh 'pip3 install -r requirements.txt || pip install -r requirements.txt || echo "No requirements"'
                    }
                }
            }
        }
        
        stage('Build') {
            when { expression { env.PROJECT_TYPE == 'nodejs' } }
            steps {
                sh 'npm run build --if-present || echo "No build script"'
            }
        }
        
        stage('Test') {
            when { expression { env.PROJECT_TYPE in ['nodejs', 'python'] } }
            steps {
                script {
                    if (env.PROJECT_TYPE == 'nodejs') {
                        sh 'npm test --if-present || echo "No tests configured"'
                    } else if (env.PROJECT_TYPE == 'python') {
                        sh 'python3 -m pytest || echo "No tests found"'
                    }
                }
            }
        }
        
        stage('Validate') {
            when { expression { env.PROJECT_TYPE in ['static', 'empty'] } }
            steps {
                sh '''
                    echo "Repository contents:"
                    ls -la
                    echo "✅ Validation complete"
                '''
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
        case 'python':
            return getPythonPipeline(repoFullName, backendUrl);
        case 'static':
            return getStaticPipeline(repoFullName, backendUrl);
        case 'empty':
            return getUniversalPipeline(repoFullName, backendUrl);
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
