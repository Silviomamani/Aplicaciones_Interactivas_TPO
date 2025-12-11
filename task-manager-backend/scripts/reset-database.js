require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const databasePath = path.join(__dirname, '../database.sqlite');
const seedFlag = process.argv.includes('--seed');

console.log('🔄 Reseteando la base de datos...\n');

// 1. Eliminar el archivo de base de datos si existe
if (fs.existsSync(databasePath)) {
  console.log('📁 Eliminando archivo database.sqlite...');
  try {
    fs.unlinkSync(databasePath);
    console.log('✅ Archivo eliminado\n');
  } catch (error) {
    if (error.code === 'EBUSY' || error.message.includes('being used')) {
      console.error('❌ ERROR: El archivo database.sqlite está en uso.');
      console.error('   Por favor, detén el servidor del backend antes de continuar.');
      console.error('   Presiona Ctrl+C en la terminal donde está corriendo el servidor.\n');
      process.exit(1);
    } else {
      throw error;
    }
  }
} else {
  console.log('ℹ️  No se encontró archivo database.sqlite\n');
}

// 2. Ejecutar migraciones
console.log('📦 Ejecutando migraciones...');
try {
  execSync('npx sequelize-cli db:migrate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Migraciones completadas\n');
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  process.exit(1);
}

// 3. Ejecutar seeders si se especificó el flag
if (seedFlag) {
  console.log('🌱 Ejecutando seeders (datos de prueba)...');
  try {
    execSync('npx sequelize-cli db:seed:all', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Seeders completados\n');
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error.message);
    process.exit(1);
  }
}

console.log('✨ Base de datos reseteada exitosamente!');
if (!seedFlag) {
  console.log('💡 Tip: Ejecuta "npm run db:reset:seed" para incluir datos de prueba');
}

