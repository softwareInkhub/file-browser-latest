const { exec } = require('child_process');

// Run the drizzle-kit generate:pg command
const command = 'npx drizzle-kit generate:pg';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
    return;
  }
  
  console.log(`Command output: ${stdout}`);
  console.log('Migration files generated successfully!');
});
