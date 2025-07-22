#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 AutoMockup API Environment Setup');
console.log('=====================================\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   Backing up to .env.backup...');
  fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

// Read the template
const templatePath = path.join(__dirname, 'env-template.txt');
if (!fs.existsSync(templatePath)) {
  console.error('❌ env-template.txt not found!');
  process.exit(1);
}

let envContent = fs.readFileSync(templatePath, 'utf8');

// Generate a random JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
envContent = envContent.replace('your_jwt_secret_here', jwtSecret);

// Write the .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('\n📝 Next steps:');
console.log('1. Edit .env and add your Zoho CRM credentials:');
console.log('   - ZOHO_CLIENT_ID');
console.log('   - ZOHO_CLIENT_SECRET');
console.log('\n2. Get your Zoho credentials from:');
console.log('   https://api-console.zoho.com/');
console.log('\n3. Use this redirect URI in Zoho:');
console.log('   https://automockupapi-git-main-siddhutedlas-projects.vercel.app/api/auth/zoho/callback');
console.log('\n4. For Vercel deployment, add these environment variables in your Vercel dashboard');
console.log('\n🔒 JWT secret has been automatically generated for security');
console.log('\n📁 .env file is in .gitignore and will not be committed to version control'); 