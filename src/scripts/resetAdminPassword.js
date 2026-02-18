require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const User = require('../models/User');

const parseArgs = (argv) => {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
};

const printHelp = () => {
  console.log('Reset admin password');
  console.log('Usage:');
  console.log('  npm run admin:reset-password -- --password <NEW_PASSWORD> [--email <ADMIN_EMAIL>]');
  console.log('');
  console.log('Notes:');
  console.log('  --email defaults to ADMIN_EMAIL from .env');
  console.log('  --password is required');
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const email = String(args.email || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = typeof args.password === 'string' ? args.password : '';

  if (!email) {
    console.error('Error: missing admin email. Use --email or set ADMIN_EMAIL in .env');
    process.exit(1);
  }

  if (!password) {
    console.error('Error: missing --password');
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    console.error(`Error: admin not found for email ${email}`);
    process.exit(1);
  }

  admin.passwordHash = await bcrypt.hash(password, 10);
  await admin.save();

  console.log(`Admin password reset successfully for ${email}`);
  process.exit(0);
};

run().catch((error) => {
  console.error('Reset admin password failed:', error);
  process.exit(1);
});
