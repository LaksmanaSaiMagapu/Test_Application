// GeoNexus frontend IV&V pipeline
// Jenkins → OpenHands (generate header.yml + Vitest tests) → Vitest+MSW → ESLint → SonarQube → ThoroTest
pipeline {
  agent any

  environment {
    PROJECT_DIR   = '/home/rupan/Documents/SampleProject-main'
    AGENT_WS      = '/srv/openhands/projects/geonexus'          // host side of the agent container's /projects/geonexus
    SONAR_SCANNER = '/home/rupan/.local/sonar-scanner/sonar-scanner-7.1.0.4889-linux-x64/bin/sonar-scanner'
    SONAR_URL     = 'http://localhost:9000'
    // ThoroTest upload endpoint — set in Jenkins global/credential config when available
    THOROTEST_URL = 'http://localhost:8100'
  }

  stages {
    stage('Sync workspace') {
      steps {
        sh '''
          rsync -a --delete \
            --exclude .git --exclude node_modules --exclude target --exclude evidence \
            "$PROJECT_DIR/" "$WORKSPACE/"
        '''
      }
    }

    stage('OpenHands: generate tests') {
      steps {
        sh '''
          cd ivv-pipeline
          # sync current workspace into the agent-visible tree
          rsync -a --delete --exclude .git --exclude target --exclude evidence \
            "$WORKSPACE/frontend/" "$AGENT_WS/frontend/"
          python3 dispatch.py run \
            --profile ivv-unit-test-writer \
            --prompt prompts/frontend-vitest.md \
            --workspace /projects/geonexus \
            --var REPO_PATH=/projects/geonexus/frontend \
            --var BUILD_TAG=$BUILD_TAG \
            --tag build=$BUILD_NUMBER --tag pipeline=frontend-ivv \
            --timeout 3600
          # pull generated tests back into the Jenkins workspace
          rsync -a "$AGENT_WS/frontend/tests/" "$WORKSPACE/frontend/tests/"
        '''
      }
    }

    stage('Vitest + MSW') {
      steps {
        dir('frontend') {
          sh 'npm ci || npm install'
          sh 'npm run test:coverage'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'frontend/reports/vitest-junit.xml'
        }
      }
    }

    stage('ESLint') {
      steps {
        dir('frontend') {
          sh 'npm run lint:eslint -- --format junit --output-file reports/eslint-junit.xml || true'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'frontend/reports/eslint-junit.xml'
          archiveArtifacts artifacts: 'frontend/reports/eslint-junit.xml', allowEmptyArchive: true
        }
      }
    }

    stage('SonarQube') {
      steps {
        dir('frontend') {
          withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
            sh '$SONAR_SCANNER -Dsonar.host.url=$SONAR_URL -Dsonar.token=$SONAR_TOKEN'
          }
        }
      }
    }

    stage('ThoroTest') {
      steps {
        withCredentials([string(credentialsId: 'thorotest-token', variable: 'THOROTEST_TOKEN')]) {
          sh '''
            # JUnit results -> ThoroTest importer (creates a test run per file)
            curl -fsS -X POST "$THOROTEST_URL/api/import/execute" \
              -H "Authorization: Bearer $THOROTEST_TOKEN" \
              -F "file=@frontend/reports/vitest-junit.xml"
            echo
          '''
        }
        archiveArtifacts artifacts: 'frontend/reports/**, frontend/tests/header.yml', allowEmptyArchive: true
      }
    }
  }
}
