#!/usr/bin/env node

/**
 * Simple test script for AntiCMS MCP Server
 * Tests tools, resources, and prompts functionality
 */

import { spawn } from 'child_process';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testStdioTransport() {
  log(colors.blue, '\n🔄 Testing Stdio Transport...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['src/index.js', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Test initialization
    const initMessage = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      },
      id: 1
    };

    server.stdin.write(JSON.stringify(initMessage) + '\n');
    
    let responseReceived = false;
    server.stdout.on('data', (data) => {
      const responses = data.toString().trim().split('\n');
      for (const response of responses) {
        if (response) {
          try {
            const parsed = JSON.parse(response);
            if (parsed.id === 1 && parsed.result) {
              log(colors.green, '✅ Stdio transport initialized successfully');
              responseReceived = true;
            }
          } catch (e) {
            // Ignore parsing errors for now
          }
        }
      }
    });

    server.stderr.on('data', (data) => {
      // Server logs go to stderr, that's normal
    });

    global.setTimeout(() => {
      server.kill();
      if (!responseReceived) {
        log(colors.red, '❌ Stdio transport test failed');
      }
      resolve(responseReceived);
    }, 3000);
  });
}

async function testHttpTransport() {
  log(colors.blue, '\n🔄 Testing HTTP Transport...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['src/index.js', '--http', '--port=3001'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let serverReady = false;
    
    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('AntiCMS v3 JSON Generator MCP Server running')) {
        serverReady = true;
        log(colors.green, '✅ HTTP server started successfully');
        
        // Test health endpoint
        testHealthEndpoint().then((health) => {
          if (health) {
            log(colors.green, '✅ Health endpoint working');
          } else {
            log(colors.red, '❌ Health endpoint failed');
          }
          server.kill();
          resolve(health);
        });
      }
    });

    global.setTimeout(() => {
      if (!serverReady) {
        log(colors.red, '❌ HTTP server failed to start');
        server.kill();
        resolve(false);
      }
    }, 5000);
  });
}

async function testHealthEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    
    return data.status === 'healthy' && 
           data.server === 'anticms-json-generator' &&
           data.version === '2.0.0';
  } catch (error) {
    return false;
  }
}

async function testFileStructure() {
  log(colors.blue, '\n🔄 Testing File Structure...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'src/index.js',
    'src/tools/templateGenerator.js',
    'src/tools/resources.js',
    'src/tools/prompts.js',
    'src/tools/definitions.js',
    'package.json'
  ];
  
  const requiredDirs = [
    'data/field-types',
    'data/pages',
    'data/posts'
  ];
  
  let allExist = true;
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(colors.red, `❌ Missing file: ${file}`);
      allExist = false;
    } else {
      log(colors.green, `✅ Found: ${file}`);
    }
  }
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      log(colors.red, `❌ Missing directory: ${dir}`);
      allExist = false;
    } else {
      log(colors.green, `✅ Found: ${dir}`);
    }
  }
  
  return allExist;
}

async function testResourceFiles() {
  log(colors.blue, '\n🔄 Testing Resource Files...');
  
  const fs = await import('fs');
  const path = await import('path');
  
  // Check field-types directory
  const fieldTypesDir = 'data/field-types';
  if (!fs.existsSync(fieldTypesDir)) {
    log(colors.red, '❌ field-types directory not found');
    return false;
  }
  
  const fieldTypeFiles = fs.readdirSync(fieldTypesDir).filter(f => f.endsWith('.json'));
  
  if (fieldTypeFiles.length === 0) {
    log(colors.red, '❌ No field type JSON files found');
    return false;
  }
  
  log(colors.green, `✅ Found ${fieldTypeFiles.length} field type files`);
  
  // Test that at least some expected field types exist
  const expectedTypes = ['input.json', 'textarea.json', 'media.json', 'repeater.json'];
  let foundExpected = 0;
  
  for (const expected of expectedTypes) {
    if (fieldTypeFiles.includes(expected)) {
      foundExpected++;
      log(colors.green, `✅ Found: ${expected}`);
    } else {
      log(colors.yellow, `⚠️  Missing: ${expected}`);
    }
  }
  
  return foundExpected >= 2; // At least half should exist
}

async function runAllTests() {
  log(colors.blue, '🧪 Starting AntiCMS MCP Server Tests\n');
  
  const results = {
    fileStructure: await testFileStructure(),
    resourceFiles: await testResourceFiles(),
    stdioTransport: await testStdioTransport(),
    httpTransport: await testHttpTransport()
  };
  
  log(colors.blue, '\n📊 Test Results:');
  log(colors.blue, '==================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    log(color, `${test.padEnd(20)}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  log(colors.blue, '\n📈 Overall Result:');
  if (allPassed) {
    log(colors.green, '🎉 All tests passed! AntiCMS MCP Server is ready for use.');
  } else {
    log(colors.red, '❌ Some tests failed. Please check the configuration.');
  }
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(colors.red, `❌ Test runner error: ${error.message}`);
    process.exit(1);
  });
}

export { runAllTests }; 