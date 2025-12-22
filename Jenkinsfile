// Universal Jenkinsfile Template for User Projects
pipeline {
    agent any

    parameters {
        string(name: 'BUILD_ID_FROM_BACKEND', defaultValue: '', description: 'The build ID from the backend system')
        booleanParam(name: 'ENABLE_DEPLOY', defaultValue: false, description: 'Check this to run the Deploy stage')
    }

    environment {
        BACKEND_URL = credentials('BACKEND_URL')
        JENKINS_API_KEY = credentials('JENKINS_API_KEY')
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out user project repository...'
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                script {
                    if (fileExists('build.sh')) {
                        echo 'Found build.sh. Executing...'
                        // Make the script executable and run it
                        sh 'chmod +x build.sh'
                        sh './build.sh'
                    } else {
                        // Fail the build if the convention is not met
                        error 'Build failed: build.sh not found in the root of the repository.'
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { params.ENABLE_DEPLOY == true }
            }
            steps {
                script {
                    if (fileExists('Dockerfile')) {
                        echo 'Primary deployment strategy: Docker detected.'
                        // Docker Hub credentials should be stored in Jenkins with this ID
                        withCredentials([usernamePassword(credentialsId: 'DOCKER_HUB_CREDENTIALS', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                            // Example: 'docker_user/repo_name:build_number'
                            def imageName = "${DOCKER_USER}/${env.JOB_NAME}:${env.BUILD_NUMBER}".toLowerCase()
                            sh "docker build -t ${imageName} ."
                            sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                            sh "docker push ${imageName}"
                        }
                    } else if (fileExists('deploy.ssh.json')) {
                        echo 'Fallback deployment strategy: SSH detected.'
                        def config = readJSON file: 'deploy.ssh.json'
                        // SSH credentials should be stored in Jenkins with this ID
                        withCredentials([sshUserPrivateKey(credentialsId: 'SSH_SERVER_CREDENTIALS', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                            def server = config.server
                            def remotePath = config.remotePath
                            def sourcePath = config.sourcePath
                            sh "scp -o StrictHostKeyChecking=no -i ${SSH_KEY} -r ${sourcePath} ${SSH_USER}@${server}:${remotePath}"
                            if(config.restartCommand) {
                                sh "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${server} '${config.restartCommand}'"
                            }
                        }
                    } else {
                        echo 'No deployment strategy found (Dockerfile or deploy.ssh.json not present). Skipping.'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def buildStatus = currentBuild.result ?: 'SUCCESS'
                def backendStatus = (buildStatus == 'SUCCESS') ? 'success' : 'failed'
                echo "Pipeline finished with status: ${buildStatus}. Notifying backend..."
                if (params.BUILD_ID_FROM_BACKEND) {
                    httpRequest(
                        url: "${env.BACKEND_URL}/builds/${params.BUILD_ID_FROM_BACKEND}/status",
                        method: 'PATCH',
                        authentication: env.JENKINS_API_KEY,
                        httpMode: 'STANDARD',
                        contentType: 'APPLICATION_JSON',
                        requestBody: "{"status": "${backendStatus}"}"
                    )
                } else {
                    echo "Skipping notification: BUILD_ID_FROM_BACKEND was not provided."
                }
            }
        }
    }
}