const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/password');

const defaultDeps = { userRepository, hashPassword };

async function updateMe(userId, { name, password }, deps = defaultDeps) {
  const passwordHash = password ? await deps.hashPassword(password) : undefined;
  const user = await deps.userRepository.updateById(userId, { name, passwordHash });
  console.log('[user] 정보 수정:', userId);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = { updateMe };
