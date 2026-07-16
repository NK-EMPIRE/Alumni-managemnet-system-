const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('../backend/src/config/database');
const authRepo = require('../backend/src/repositories/auth.repository');
const { hashPassword, comparePassword } = require('../backend/src/utils/password');

async function test() {
  try {
    console.log('Connecting to database...');
    const pool = await connectDB();
    console.log('Connected!');

    // Find the member user
    console.log('Finding user by login ID: member1@gmail.com');
    const user = await authRepo.findByLoginId('member1@gmail.com');
    if (!user) {
      console.log('User member1@gmail.com not found!');
      return;
    }

    console.log('Found user:', {
      user_id: user.user_id,
      email: user.email,
      password_hash: user.password_hash
    });

    console.log('Testing updatePassword...');
    const newPassword = 'NewPassword@123';
    const hashed = await hashPassword(newPassword);
    console.log('New hash:', hashed);

    await authRepo.updatePassword(user.user_id, hashed);
    console.log('Update password called!');

    const updatedUser = await authRepo.findByLoginId('member1@gmail.com');
    console.log('Updated user hash:', updatedUser.password_hash);
    
    const match = await comparePassword(newPassword, updatedUser.password_hash);
    console.log('Does new password match updated hash?', match);

    // Let's restore the original password hash for member1@gmail.com so we don't break the user's login!
    await authRepo.updatePassword(user.user_id, user.password_hash);
    console.log('Restored original hash!');

  } catch (err) {
    console.error('Error during test:', err);
  }
}

test().then(() => process.exit(0));
