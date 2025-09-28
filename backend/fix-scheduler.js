const { exec } = require('child_process');
const path = require('path');

async function fixScheduler() {
  console.log('🔧 Fixing Auto Scheduler Issues...\n');
  
  try {
    // First, debug the current state
    console.log('1️⃣ Debugging current database state...');
    await runScript('debug-scheduler.js');
    
    console.log('\n2️⃣ Creating sample data if needed...');
    await runScript('create-sample-data.js');
    
    console.log('\n3️⃣ Debugging again to verify data...');
    await runScript('debug-scheduler.js');
    
    console.log('\n✅ Fix process completed!');
    console.log('Now try the auto scheduler in the frontend.');
    
  } catch (error) {
    console.error('❌ Error in fix process:', error);
  }
}

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${scriptPath}:`, error);
        reject(error);
        return;
      }
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve();
    });
  });
}

fixScheduler();
